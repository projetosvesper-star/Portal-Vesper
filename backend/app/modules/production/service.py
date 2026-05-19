"""Domain service for the simple Kanban Producao foundation."""

from __future__ import annotations

from datetime import UTC, datetime, time
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.models import User
from app.modules.kanban.models import KanbanActivityLog, KanbanBoard, KanbanCard, KanbanColumn
from app.modules.production import events
from app.modules.production.models import (
    ProductionChecklistTemplate,
    ProductionChecklistTemplateItem,
    ProductionOrder,
    ProductionOrderActivityLog,
    ProductionOrderChecklistItem,
)
from app.modules.production.repository import ProductionRepository

BOARD_KEY = "kanban_producao"
BOARD_NAME = "Kanban Producao"
BOARD_COLUMNS = [
    ("aberta", "Aberta", 0, False),
    ("em_andamento", "Em andamento", 1, False),
    ("aguardando", "Aguardando", 2, False),
    ("pronta", "Pronta", 3, True),
    ("arquivada", "Arquivada", 4, True),
]
PRIORITY_TO_CARD = {"baixa": "low", "normal": "medium", "alta": "high", "urgente": "critical"}
VALID_STATUSES = {"aberta", "em_andamento", "aguardando", "pronta", "arquivada"}
VALID_PRIORITIES = {"baixa", "normal", "alta", "urgente"}
STATUS_RANK = {"aberta": 0, "em_andamento": 1, "aguardando": 2, "pronta": 3, "arquivada": 4}
PRIORITY_RANK = {"urgente": 0, "alta": 1, "normal": 2, "baixa": 3}


class ProductionService:
    def __init__(self, session: AsyncSession, repo: ProductionRepository | None = None) -> None:
        self.session = session
        self.repo = repo or ProductionRepository(session)

    async def _activity(
        self,
        action: str,
        *,
        order: ProductionOrder | None = None,
        card_id: UUID | None = None,
        actor_user_id: UUID | None = None,
        old_value: dict | None = None,
        new_value: dict | None = None,
        metadata: dict | None = None,
    ) -> ProductionOrderActivityLog:
        log = ProductionOrderActivityLog(
            production_order_id=order.id if order else None,
            card_id=card_id or (order.card_id if order else None),
            user_id=actor_user_id,
            action=action,
            old_value_json=old_value,
            new_value_json=new_value,
            metadata_json=metadata or {},
        )
        return await self.repo.create_activity_log(log)

    async def _audit(
        self,
        action: str,
        *,
        actor_user_id: UUID | None,
        entity_type: str,
        entity_id: UUID | None,
        metadata: dict | None = None,
    ) -> None:
        await write_audit_log(
            self.session,
            action,
            user_id=actor_user_id,
            module_key="kanban_producao",
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata,
        )

    async def _emit(self, event_type: str, payload: dict, *, actor: User | None = None, kanban_changed: bool = False) -> None:
        await events.publish_production_event(
            event_type,
            payload,
            actor_user_id=str(actor.id) if actor else None,
            publish_kanban_changed=kanban_changed,
        )

    async def ensure_board(self, actor: User | None = None) -> KanbanBoard:
        board = await self.repo.get_board_by_key(BOARD_KEY)
        if board is None:
            board = KanbanBoard(
                key=BOARD_KEY,
                name=BOARD_NAME,
                description="Controle simples de Ordens de Producao.",
                board_type="production",
                module_context="producao",
                icon="Factory",
                is_active=True,
                is_archived=False,
                created_by=actor.id if actor else None,
                metadata_json={"production_type": "simple"},
            )
            await self.repo.add(board)
        for key, name, order_index, is_done in BOARD_COLUMNS:
            column = await self.repo.get_column_by_key(board.id, key)
            if column is None:
                await self.repo.add(
                    KanbanColumn(
                        board_id=board.id,
                        key=key,
                        name=name,
                        order_index=order_index,
                        is_done=is_done,
                        is_active=True,
                        metadata_json={"production_status": key},
                    )
                )
        await self.session.flush()
        return board

    async def _status_column(self, board_id: UUID, status: str) -> KanbanColumn:
        column = await self.repo.get_column_by_key(board_id, status)
        if column is None:
            raise HTTPException(status_code=500, detail="Coluna de producao nao encontrada")
        return column

    def _card_title(self, payload: dict) -> str:
        parts = [payload.get("numero_op")]
        for key in ("cliente", "projeto", "modelo"):
            value = payload.get(key)
            if value:
                parts.append(str(value))
        return " - ".join([p for p in parts if p])

    def _due_datetime(self, order: ProductionOrder) -> datetime | None:
        if not order.data_entrega:
            return None
        return datetime.combine(order.data_entrega, time.min, tzinfo=UTC)

    def _order_payload(self, order: ProductionOrder) -> dict:
        return {
            "production_order_id": str(order.id),
            "production_type": "simple",
            "percentual_checklist": float(order.percentual_checklist or 0),
            "numero_op": order.numero_op,
            "status": order.status,
        }

    async def _sync_card_from_order(self, order: ProductionOrder) -> KanbanCard:
        card = await self.session.get(KanbanCard, order.card_id)
        if card is None:
            raise HTTPException(status_code=500, detail="Card vinculado a OP nao encontrado")
        column = await self._status_column(order.board_id, order.status)
        card.column_id = column.id
        card.title = self._card_title(
            {
                "numero_op": order.numero_op,
                "cliente": order.cliente,
                "projeto": order.projeto,
                "modelo": order.modelo,
            }
        )
        card.code = order.numero_op
        card.priority = PRIORITY_TO_CARD.get(order.prioridade, "medium")
        card.status = order.status
        card.due_date = self._due_datetime(order)
        metadata = dict(card.metadata_json or {})
        metadata.update(self._order_payload(order))
        card.metadata_json = metadata
        card.is_archived = order.is_archived
        card.archived_at = order.archived_at
        card.deleted_at = order.deleted_at
        await self.repo.update(card)
        return card

    async def _recalculate_percent(self, order: ProductionOrder) -> Decimal:
        items = await self.repo.list_checklist_items(order.id)
        if not items:
            order.percentual_checklist = Decimal("0.00")
        else:
            done = len([item for item in items if item.is_done])
            order.percentual_checklist = Decimal(done * 100 / len(items)).quantize(Decimal("0.01"))
        await self.repo.update(order)
        await self._sync_card_from_order(order)
        return order.percentual_checklist

    async def list_orders(self, *, include_archived: bool = False, limit: int = 100, offset: int = 0) -> list[ProductionOrder]:
        return await self.repo.list_orders(include_archived=include_archived, limit=limit, offset=offset)

    async def get_order(self, order_id: UUID) -> ProductionOrder:
        order = await self.repo.get_order_detail(order_id)
        if order is None or order.deleted_at is not None:
            raise HTTPException(status_code=404, detail="OP nao encontrada")
        return order

    async def create_order(self, payload: dict, actor: User) -> ProductionOrder:
        if payload["prioridade"] not in VALID_PRIORITIES or payload["status"] not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="Prioridade ou status invalido")
        if await self.repo.get_order_by_numero(payload["numero_op"]):
            raise HTTPException(status_code=409, detail="Numero de OP ja existe")

        board = await self.ensure_board(actor)
        column = await self._status_column(board.id, payload["status"])
        card = KanbanCard(
            board_id=board.id,
            column_id=column.id,
            title=self._card_title(payload),
            description=payload.get("observacoes"),
            code=payload["numero_op"],
            priority=PRIORITY_TO_CARD[payload["prioridade"]],
            status=payload["status"],
            order_index=await self.repo.next_card_order(board.id, column.id),
            due_date=datetime.combine(payload["data_entrega"], time.min, tzinfo=UTC) if payload.get("data_entrega") else None,
            created_by=actor.id,
            is_archived=False,
            metadata_json={"production_type": "simple"},
        )
        await self.repo.add(card)

        order = ProductionOrder(
            card_id=card.id,
            board_id=board.id,
            numero_op=payload["numero_op"],
            cliente=payload.get("cliente"),
            projeto=payload.get("projeto"),
            modelo=payload.get("modelo"),
            quantidade=payload.get("quantidade"),
            setor=payload.get("setor"),
            data_inicio=payload.get("data_inicio"),
            data_entrega=payload.get("data_entrega"),
            prioridade=payload["prioridade"],
            status=payload["status"],
            observacoes=payload.get("observacoes"),
            created_by=actor.id,
            updated_by=actor.id,
            metadata_json=payload.get("metadata") or {},
        )
        await self.repo.add(order)

        template = await self.repo.get_template(payload["checklist_template_id"]) if payload.get("checklist_template_id") else await self.repo.get_default_template()
        if template:
            for item in sorted(template.items, key=lambda template_item: template_item.order_index):
                await self.repo.add(
                    ProductionOrderChecklistItem(
                        production_order_id=order.id,
                        title=item.title,
                        description=item.description,
                        order_index=item.order_index,
                        is_required=item.is_required,
                        metadata_json=dict(item.metadata_json or {}),
                    )
                )

        await self._recalculate_percent(order)
        card.metadata_json.update({"production_order_id": str(order.id), "percentual_checklist": float(order.percentual_checklist)})
        await self.repo.update(card)
        await self._activity(events.PRODUCTION_OP_CREATED, order=order, actor_user_id=actor.id, new_value={"numero_op": order.numero_op})
        await self.repo.add(
            KanbanActivityLog(
                board_id=board.id,
                card_id=card.id,
                user_id=actor.id,
                action="production.op.created",
                new_value_json={"production_order_id": str(order.id), "numero_op": order.numero_op},
                metadata_json={"module_key": "kanban_producao"},
            )
        )
        await self._audit(events.PRODUCTION_OP_CREATED, actor_user_id=actor.id, entity_type="production_orders", entity_id=order.id)
        await self._emit(
            events.PRODUCTION_OP_CREATED,
            {"production_order_id": str(order.id), "card_id": str(card.id), "numero_op": order.numero_op, "board_id": str(board.id)},
            actor=actor,
            kanban_changed=True,
        )
        return await self.get_order(order.id)

    async def update_order(self, order_id: UUID, payload: dict, actor: User) -> ProductionOrder:
        order = await self.get_order(order_id)
        old = {"numero_op": order.numero_op, "prioridade": order.prioridade, "status": order.status}
        if "numero_op" in payload and payload["numero_op"] != order.numero_op:
            existing = await self.repo.get_order_by_numero(payload["numero_op"])
            if existing and existing.id != order.id:
                raise HTTPException(status_code=409, detail="Numero de OP ja existe")
        for field in (
            "numero_op",
            "cliente",
            "projeto",
            "modelo",
            "quantidade",
            "setor",
            "data_inicio",
            "data_entrega",
            "prioridade",
            "status",
            "observacoes",
        ):
            if field in payload:
                setattr(order, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            order.metadata_json = payload["metadata"]
        order.updated_by = actor.id
        await self.repo.update(order)
        await self._sync_card_from_order(order)
        await self._activity(events.PRODUCTION_OP_UPDATED, order=order, actor_user_id=actor.id, old_value=old, new_value=payload)
        await self._audit(events.PRODUCTION_OP_UPDATED, actor_user_id=actor.id, entity_type="production_orders", entity_id=order.id, metadata=payload)
        await self._emit(
            events.PRODUCTION_OP_UPDATED,
            {"production_order_id": str(order.id), "card_id": str(order.card_id), "numero_op": order.numero_op},
            actor=actor,
            kanban_changed=True,
        )
        return await self.get_order(order.id)

    async def archive_order(self, order_id: UUID, actor: User) -> ProductionOrder:
        order = await self.get_order(order_id)
        if order.is_archived:
            return order
        order.metadata_json = {**(order.metadata_json or {}), "previous_status": order.status}
        order.status = "arquivada"
        order.is_archived = True
        order.archived_at = datetime.now(UTC)
        order.updated_by = actor.id
        await self.repo.update(order)
        await self._sync_card_from_order(order)
        await self._activity(events.PRODUCTION_OP_ARCHIVED, order=order, actor_user_id=actor.id)
        await self._audit(events.PRODUCTION_OP_ARCHIVED, actor_user_id=actor.id, entity_type="production_orders", entity_id=order.id)
        await self._emit(events.PRODUCTION_OP_ARCHIVED, {"production_order_id": str(order.id), "card_id": str(order.card_id)}, actor=actor, kanban_changed=True)
        return await self.get_order(order.id)

    async def restore_order(self, order_id: UUID, actor: User) -> ProductionOrder:
        order = await self.get_order(order_id)
        order.is_archived = False
        order.archived_at = None
        order.status = (order.metadata_json or {}).get("previous_status") or "aberta"
        if order.status == "arquivada":
            order.status = "aberta"
        order.updated_by = actor.id
        await self.repo.update(order)
        await self._sync_card_from_order(order)
        await self._activity(events.PRODUCTION_OP_RESTORED, order=order, actor_user_id=actor.id)
        await self._emit(events.PRODUCTION_OP_RESTORED, {"production_order_id": str(order.id), "card_id": str(order.card_id)}, actor=actor, kanban_changed=True)
        return await self.get_order(order.id)

    async def soft_delete_order(self, order_id: UUID, actor: User) -> ProductionOrder:
        order = await self.get_order(order_id)
        order.deleted_at = datetime.now(UTC)
        order.updated_by = actor.id
        await self.repo.update(order)
        await self._sync_card_from_order(order)
        await self._activity(events.PRODUCTION_OP_DELETED, order=order, actor_user_id=actor.id)
        await self._audit(events.PRODUCTION_OP_DELETED, actor_user_id=actor.id, entity_type="production_orders", entity_id=order.id)
        await self._emit(events.PRODUCTION_OP_DELETED, {"production_order_id": str(order.id), "card_id": str(order.card_id)}, actor=actor, kanban_changed=True)
        return order

    async def list_checklist(self, order_id: UUID) -> list[ProductionOrderChecklistItem]:
        order = await self.get_order(order_id)
        return await self.repo.list_checklist_items(order.id)

    async def create_checklist_item(self, order_id: UUID, payload: dict, actor: User) -> ProductionOrderChecklistItem:
        order = await self.get_order(order_id)
        items = await self.repo.list_checklist_items(order.id)
        item = ProductionOrderChecklistItem(
            production_order_id=order.id,
            title=payload["title"],
            description=payload.get("description"),
            order_index=payload.get("order_index") if payload.get("order_index") is not None else len(items),
            is_required=payload.get("is_required", False),
            metadata_json=payload.get("metadata") or {},
        )
        await self.repo.add(item)
        await self._recalculate_percent(order)
        await self._activity(events.PRODUCTION_CHECKLIST_ITEM_CREATED, order=order, actor_user_id=actor.id, new_value={"item_id": str(item.id), "title": item.title})
        await self._emit(events.PRODUCTION_CHECKLIST_ITEM_CREATED, {"production_order_id": str(order.id), "item_id": str(item.id)}, actor=actor, kanban_changed=True)
        return await self.repo.update(item)

    async def update_checklist_item(self, item_id: UUID, payload: dict, actor: User) -> ProductionOrderChecklistItem:
        item = await self.repo.get_checklist_item(item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item de checklist nao encontrado")
        order = await self.get_order(item.production_order_id)
        old = {"is_done": item.is_done, "title": item.title}
        for field in ("title", "description", "order_index", "is_required"):
            if field in payload and payload[field] is not None:
                setattr(item, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            item.metadata_json = payload["metadata"]
        if "is_done" in payload and payload["is_done"] is not None:
            item.is_done = payload["is_done"]
            if item.is_done:
                item.done_by = actor.id
                item.done_at = datetime.now(UTC)
            else:
                item.done_by = None
                item.done_at = None
        await self.repo.update(item)
        await self._recalculate_percent(order)
        await self._activity(events.PRODUCTION_CHECKLIST_ITEM_UPDATED, order=order, actor_user_id=actor.id, old_value=old, new_value=payload)
        await self._emit(
            events.PRODUCTION_CHECKLIST_ITEM_UPDATED,
            {"production_order_id": str(order.id), "item_id": str(item.id), "is_done": item.is_done},
            actor=actor,
            kanban_changed=True,
        )
        return item

    async def delete_checklist_item(self, item_id: UUID, actor: User) -> None:
        item = await self.repo.get_checklist_item(item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item de checklist nao encontrado")
        order = await self.get_order(item.production_order_id)
        await self.repo.delete(item)
        await self.session.flush()
        await self._recalculate_percent(order)
        await self._activity(events.PRODUCTION_CHECKLIST_ITEM_DELETED, order=order, actor_user_id=actor.id, metadata={"item_id": str(item_id)})
        await self._emit(events.PRODUCTION_CHECKLIST_ITEM_DELETED, {"production_order_id": str(order.id), "item_id": str(item_id)}, actor=actor, kanban_changed=True)

    async def reorder_checklist(self, order_id: UUID, items: list[dict], actor: User) -> list[ProductionOrderChecklistItem]:
        order = await self.get_order(order_id)
        existing = {item.id: item for item in await self.repo.list_checklist_items(order.id)}
        for row in items:
            item_id = row["item_id"]
            if item_id not in existing:
                raise HTTPException(status_code=400, detail="Item invalido para esta OP")
            existing[item_id].order_index = int(row["order_index"])
        await self.session.flush()
        await self._activity(events.PRODUCTION_CHECKLIST_REORDERED, order=order, actor_user_id=actor.id, new_value={"items": [(str(i["item_id"]), i["order_index"]) for i in items]})
        await self._emit(events.PRODUCTION_CHECKLIST_REORDERED, {"production_order_id": str(order.id)}, actor=actor, kanban_changed=True)
        return await self.repo.list_checklist_items(order.id)

    async def list_templates(self, include_inactive: bool = False) -> list[ProductionChecklistTemplate]:
        return await self.repo.list_templates(include_inactive=include_inactive)

    async def get_template(self, template_id: UUID) -> ProductionChecklistTemplate:
        template = await self.repo.get_template(template_id)
        if template is None:
            raise HTTPException(status_code=404, detail="Template nao encontrado")
        return template

    async def create_template(self, payload: dict, actor: User) -> ProductionChecklistTemplate:
        template = ProductionChecklistTemplate(
            name=payload["name"],
            description=payload.get("description"),
            template_type=payload.get("template_type", "producao"),
            is_default=payload.get("is_default", False),
            is_active=payload.get("is_active", True),
            created_by=actor.id,
            metadata_json=payload.get("metadata") or {},
        )
        await self.repo.add(template)
        for item_payload in payload.get("items") or []:
            await self.repo.add(
                ProductionChecklistTemplateItem(
                    template_id=template.id,
                    title=item_payload["title"],
                    description=item_payload.get("description"),
                    order_index=item_payload["order_index"],
                    is_required=item_payload.get("is_required", False),
                    metadata_json=item_payload.get("metadata") or {},
                )
            )
        await self._activity(events.PRODUCTION_TEMPLATE_CREATED, actor_user_id=actor.id, metadata={"template_id": str(template.id)})
        await self._emit(events.PRODUCTION_TEMPLATE_CREATED, {"template_id": str(template.id), "name": template.name}, actor=actor)
        return await self.get_template(template.id)

    async def update_template(self, template_id: UUID, payload: dict, actor: User) -> ProductionChecklistTemplate:
        template = await self.get_template(template_id)
        for field in ("name", "description", "template_type", "is_default", "is_active"):
            if field in payload and payload[field] is not None:
                setattr(template, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            template.metadata_json = payload["metadata"]
        await self.repo.update(template)
        await self._activity(events.PRODUCTION_TEMPLATE_UPDATED, actor_user_id=actor.id, metadata={"template_id": str(template.id)})
        await self._emit(events.PRODUCTION_TEMPLATE_UPDATED, {"template_id": str(template.id), "name": template.name}, actor=actor)
        return await self.get_template(template.id)

    async def delete_template(self, template_id: UUID, actor: User) -> None:
        template = await self.get_template(template_id)
        template.is_active = False
        await self.repo.update(template)
        await self._activity(events.PRODUCTION_TEMPLATE_DELETED, actor_user_id=actor.id, metadata={"template_id": str(template.id)})
        await self._emit(events.PRODUCTION_TEMPLATE_DELETED, {"template_id": str(template.id), "name": template.name}, actor=actor)

    async def create_template_item(self, template_id: UUID, payload: dict, actor: User) -> ProductionChecklistTemplateItem:
        template = await self.get_template(template_id)
        item = ProductionChecklistTemplateItem(
            template_id=template.id,
            title=payload["title"],
            description=payload.get("description"),
            order_index=payload["order_index"],
            is_required=payload.get("is_required", False),
            metadata_json=payload.get("metadata") or {},
        )
        await self.repo.add(item)
        await self._emit(events.PRODUCTION_TEMPLATE_UPDATED, {"template_id": str(template.id), "item_id": str(item.id)}, actor=actor)
        return await self.repo.update(item)

    async def update_template_item(self, item_id: UUID, payload: dict, actor: User) -> ProductionChecklistTemplateItem:
        item = await self.repo.get_template_item(item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item de template nao encontrado")
        for field in ("title", "description", "order_index", "is_required"):
            if field in payload and payload[field] is not None:
                setattr(item, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            item.metadata_json = payload["metadata"]
        await self.repo.update(item)
        await self._emit(events.PRODUCTION_TEMPLATE_UPDATED, {"template_id": str(item.template_id), "item_id": str(item.id)}, actor=actor)
        return item

    async def delete_template_item(self, item_id: UUID, actor: User) -> None:
        item = await self.repo.get_template_item(item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Item de template nao encontrado")
        template_id = item.template_id
        await self.repo.delete(item)
        await self._emit(events.PRODUCTION_TEMPLATE_UPDATED, {"template_id": str(template_id), "deleted_item_id": str(item_id)}, actor=actor)

    async def dashboard(self) -> dict:
        counts = await self.repo.dashboard_counts()
        return {
            "total_ops": sum(counts.values()),
            "abertas": counts.get("aberta", 0),
            "em_andamento": counts.get("em_andamento", 0),
            "aguardando": counts.get("aguardando", 0),
            "prontas": counts.get("pronta", 0),
            "arquivadas": counts.get("arquivada", 0),
            "percentual_medio_checklist": Decimal(await self.repo.average_checklist_percent()).quantize(Decimal("0.01")),
        }

    async def tv(self, *, mode: str = "list", limit: int = 50, include_done: bool = True) -> dict:
        orders = await self.repo.list_orders(include_archived=include_done, limit=limit, offset=0)
        if not include_done:
            orders = [order for order in orders if order.status not in {"pronta", "arquivada"}]
        orders.sort(
            key=lambda order: (
                PRIORITY_RANK.get(order.prioridade, 9),
                order.data_entrega or datetime.max.date(),
                STATUS_RANK.get(order.status, 9),
            )
        )
        items = []
        for order in orders[:limit]:
            card = await self.session.get(KanbanCard, order.card_id)
            items.append(
                {
                    "numero_op": order.numero_op,
                    "cliente": order.cliente,
                    "projeto": order.projeto,
                    "modelo": order.modelo,
                    "status": order.status,
                    "prioridade": order.prioridade,
                    "percentual_checklist": order.percentual_checklist,
                    "data_entrega": order.data_entrega,
                    "card_id": order.card_id,
                    "column_id": card.column_id if card else None,
                }
            )
        if mode == "kanban":
            grouped: dict[str, list[dict]] = {}
            for item in items:
                grouped.setdefault(item["status"], []).append(item)
            return {"mode": mode, "items": grouped}
        return {"mode": "list", "items": items}

    async def activity(self, order_id: UUID, limit: int = 100) -> list[ProductionOrderActivityLog]:
        order = await self.get_order(order_id)
        return await self.repo.list_activity(order.id, limit=limit)
