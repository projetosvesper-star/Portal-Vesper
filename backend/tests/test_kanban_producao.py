from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.permissions import require_permission
from app.main import app
from app.models import User
from app.modules.kanban.models import KanbanBoard, KanbanCard, KanbanColumn
from app.modules.production import events
from app.modules.production.models import (
    ProductionChecklistTemplate,
    ProductionChecklistTemplateItem,
    ProductionOrder,
    ProductionOrderActivityLog,
    ProductionOrderChecklistItem,
)
from app.modules.production.permissions import KANBAN_PRODUCAO_OP_CREATE
from app.modules.production.service import ProductionService


class FakeProductionRepo:
    def __init__(self) -> None:
        self.boards: dict[UUID, KanbanBoard] = {}
        self.columns: dict[UUID, KanbanColumn] = {}
        self.cards: dict[UUID, KanbanCard] = {}
        self.orders: dict[UUID, ProductionOrder] = {}
        self.templates: dict[UUID, ProductionChecklistTemplate] = {}
        self.template_items: dict[UUID, ProductionChecklistTemplateItem] = {}
        self.checklist_items: dict[UUID, ProductionOrderChecklistItem] = {}
        self.logs: list[ProductionOrderActivityLog] = []
        self.deleted: list[object] = []

    async def get_board_by_key(self, key: str):
        return next((board for board in self.boards.values() if board.key == key), None)

    async def get_column_by_key(self, board_id: UUID, key: str):
        return next((column for column in self.columns.values() if column.board_id == board_id and column.key == key), None)

    async def list_columns(self, board_id: UUID):
        return [column for column in self.columns.values() if column.board_id == board_id]

    async def next_card_order(self, board_id: UUID, column_id: UUID):
        existing = [card.order_index for card in self.cards.values() if card.board_id == board_id and card.column_id == column_id]
        return (max(existing) if existing else -1) + 1

    async def add(self, entity):
        entity.id = entity.id or uuid4()
        if isinstance(entity, KanbanBoard):
            self.boards[entity.id] = entity
        elif isinstance(entity, KanbanColumn):
            self.columns[entity.id] = entity
        elif isinstance(entity, KanbanCard):
            self.cards[entity.id] = entity
        elif isinstance(entity, ProductionOrder):
            self.orders[entity.id] = entity
        elif isinstance(entity, ProductionChecklistTemplate):
            self.templates[entity.id] = entity
        elif isinstance(entity, ProductionChecklistTemplateItem):
            self.template_items[entity.id] = entity
            template = self.templates.get(entity.template_id)
            if template:
                template.items = [*getattr(template, "items", []), entity]
        elif isinstance(entity, ProductionOrderChecklistItem):
            self.checklist_items[entity.id] = entity
        elif isinstance(entity, ProductionOrderActivityLog):
            self.logs.append(entity)
        return entity

    async def update(self, entity):
        await self.add(entity)
        return entity

    async def get_order(self, order_id: UUID):
        return self.orders.get(order_id)

    async def get_order_detail(self, order_id: UUID):
        order = self.orders.get(order_id)
        if order:
            order.checklist_items = await self.list_checklist_items(order.id)
        return order

    async def get_order_by_numero(self, numero_op: str):
        return next((order for order in self.orders.values() if order.numero_op == numero_op), None)

    async def list_orders(self, **_kwargs):
        return [order for order in self.orders.values() if order.deleted_at is None]

    async def get_default_template(self):
        template = next((template for template in self.templates.values() if template.is_default and template.is_active), None)
        if template:
            template.items = await self.list_template_items(template.id)
        return template

    async def get_template(self, template_id: UUID):
        template = self.templates.get(template_id)
        if template:
            template.items = await self.list_template_items(template.id)
        return template

    async def list_templates(self, include_inactive: bool = False):
        return [template for template in self.templates.values() if include_inactive or template.is_active]

    async def list_template_items(self, template_id: UUID):
        return sorted([item for item in self.template_items.values() if item.template_id == template_id], key=lambda item: item.order_index)

    async def get_template_item(self, item_id: UUID):
        return self.template_items.get(item_id)

    async def get_checklist_item(self, item_id: UUID):
        return self.checklist_items.get(item_id)

    async def list_checklist_items(self, order_id: UUID):
        return sorted([item for item in self.checklist_items.values() if item.production_order_id == order_id], key=lambda item: item.order_index)

    async def delete(self, entity):
        self.deleted.append(entity)
        if isinstance(entity, ProductionOrderChecklistItem):
            self.checklist_items.pop(entity.id, None)
        if isinstance(entity, ProductionChecklistTemplateItem):
            self.template_items.pop(entity.id, None)

    async def create_activity_log(self, log: ProductionOrderActivityLog):
        self.logs.append(log)
        return log

    async def list_activity(self, order_id: UUID, limit: int = 100):
        return [log for log in self.logs if log.production_order_id == order_id][:limit]

    async def dashboard_counts(self):
        counts: dict[str, int] = {}
        for order in self.orders.values():
            if order.deleted_at is None:
                counts[order.status] = counts.get(order.status, 0) + 1
        return counts

    async def average_checklist_percent(self):
        values = [float(order.percentual_checklist) for order in self.orders.values() if order.deleted_at is None]
        return sum(values) / len(values) if values else 0


class FakeSession:
    def __init__(self, repo: FakeProductionRepo):
        self.repo = repo

    async def flush(self):
        return None

    async def get(self, model, entity_id):
        if model is KanbanCard:
            return self.repo.cards.get(entity_id)
        return None


@pytest.fixture()
def actor_admin() -> User:
    return User(id=uuid4(), username="Admin", name="Administrador", password_hash="hash", status="active", is_superuser=True)


@pytest.fixture()
def production_repo() -> FakeProductionRepo:
    repo = FakeProductionRepo()
    template = ProductionChecklistTemplate(
        id=uuid4(),
        name="Checklist Producao Basico",
        template_type="producao",
        is_default=True,
        is_active=True,
        metadata_json={},
    )
    repo.templates[template.id] = template
    for idx, title in enumerate(["Conferir desenho", "Separar materiais"]):
        item = ProductionChecklistTemplateItem(
            id=uuid4(),
            template_id=template.id,
            title=title,
            order_index=idx,
            is_required=False,
            metadata_json={},
        )
        repo.template_items[item.id] = item
    return repo


def test_list_ops_requires_login(monkeypatch):
    async def fake_close_redis():
        return None

    monkeypatch.setattr("app.main.close_redis", fake_close_redis)
    with TestClient(app) as client:
        response = client.get("/api/kanban/producao/ops")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_op_requires_permission(monkeypatch):
    user = User(id=uuid4(), username="u", name="U", password_hash="x", status="active", is_superuser=False)
    dependency = require_permission(KANBAN_PRODUCAO_OP_CREATE)

    async def fake_get_user_permissions(_session, _user):
        return {"kanban_producao.view", "kanban_producao.op.view"}

    monkeypatch.setattr("app.core.permissions.get_user_permissions", fake_get_user_permissions)
    with pytest.raises(HTTPException) as exc:
        await dependency(current_user=user, session=None)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_creates_op_card_and_copies_template(actor_admin, production_repo, monkeypatch):
    emitted: list[str] = []

    async def fake_emit(event_type, *_args, **_kwargs):
        emitted.append(event_type)

    async def fake_audit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(events, "publish_production_event", fake_emit)
    monkeypatch.setattr("app.modules.production.service.write_audit_log", fake_audit)
    service = ProductionService(FakeSession(production_repo), repo=production_repo)  # type: ignore[arg-type]

    order = await service.create_order(
        {
            "numero_op": "OP-TST-0001",
            "cliente": "Cliente Teste",
            "projeto": "Projeto Teste",
            "modelo": "Modelo X",
            "quantidade": 1,
            "setor": "Fabricacao",
            "data_inicio": date(2026, 5, 19),
            "data_entrega": date(2026, 5, 30),
            "prioridade": "normal",
            "status": "aberta",
            "metadata": {},
        },
        actor_admin,
    )

    assert order.card_id in production_repo.cards
    assert len(await production_repo.list_checklist_items(order.id)) == 2
    assert events.PRODUCTION_OP_CREATED in emitted


@pytest.mark.asyncio
async def test_checklist_is_editable_and_recalculates_percent(actor_admin, production_repo, monkeypatch):
    async def fake_emit(*_args, **_kwargs):
        return None

    async def fake_audit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(events, "publish_production_event", fake_emit)
    monkeypatch.setattr("app.modules.production.service.write_audit_log", fake_audit)
    service = ProductionService(FakeSession(production_repo), repo=production_repo)  # type: ignore[arg-type]
    order = await service.create_order(
        {
            "numero_op": "OP-TST-0002",
            "prioridade": "normal",
            "status": "aberta",
            "metadata": {},
        },
        actor_admin,
    )
    template_item_titles = [item.title for item in production_repo.template_items.values()]
    checklist_items = await service.list_checklist(order.id)
    assert [item.title for item in checklist_items] == template_item_titles

    new_item = await service.create_checklist_item(order.id, {"title": "Item livre", "metadata": {}}, actor_admin)
    await service.update_checklist_item(new_item.id, {"is_done": True}, actor_admin)
    refreshed = await service.get_order(order.id)
    assert refreshed.percentual_checklist == Decimal("33.33")
    assert [item.title for item in production_repo.template_items.values()] == template_item_titles

    await service.delete_checklist_item(new_item.id, actor_admin)
    refreshed = await service.get_order(order.id)
    assert refreshed.percentual_checklist == Decimal("0.00")


@pytest.mark.asyncio
async def test_template_specific_dashboard_tv_archive_restore_delete(actor_admin, production_repo, monkeypatch):
    async def fake_emit(*_args, **_kwargs):
        return None

    async def fake_audit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(events, "publish_production_event", fake_emit)
    monkeypatch.setattr("app.modules.production.service.write_audit_log", fake_audit)
    service = ProductionService(FakeSession(production_repo), repo=production_repo)  # type: ignore[arg-type]
    template = await service.create_template(
        {
            "name": "Template Teste",
            "template_type": "custom",
            "is_default": False,
            "is_active": True,
            "metadata": {},
            "items": [{"title": "Passo A", "order_index": 0, "metadata": {}}],
        },
        actor_admin,
    )
    await service.create_template_item(template.id, {"title": "Passo B", "order_index": 1, "metadata": {}}, actor_admin)
    order = await service.create_order(
        {
            "numero_op": "OP-TST-0003",
            "prioridade": "alta",
            "status": "aberta",
            "checklist_template_id": template.id,
            "metadata": {},
        },
        actor_admin,
    )
    assert len(await service.list_checklist(order.id)) == 2

    archived = await service.archive_order(order.id, actor_admin)
    assert archived.is_archived is True
    assert production_repo.cards[archived.card_id].is_archived is True

    restored = await service.restore_order(order.id, actor_admin)
    assert restored.is_archived is False
    assert production_repo.cards[restored.card_id].is_archived is False

    dashboard = await service.dashboard()
    assert dashboard["total_ops"] == 1

    tv = await service.tv(mode="list")
    assert tv["items"][0]["numero_op"] == "OP-TST-0003"

    deleted = await service.soft_delete_order(order.id, actor_admin)
    assert deleted.deleted_at is not None
    assert production_repo.cards[deleted.card_id].deleted_at is not None
