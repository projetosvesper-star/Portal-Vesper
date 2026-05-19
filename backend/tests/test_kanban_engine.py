from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.permissions import require_permission
from app.main import app
from app.models import User
from app.modules.kanban import events
from app.modules.kanban.models import (
    KanbanActivityLog,
    KanbanAttachment,
    KanbanBoard,
    KanbanCard,
    KanbanChecklistItem,
    KanbanColumn,
    KanbanComment,
)
from app.modules.kanban.service import KanbanService


class FakeKanbanRepo:
    def __init__(self) -> None:
        self.boards: dict[UUID, KanbanBoard] = {}
        self.columns: dict[UUID, KanbanColumn] = {}
        self.cards: dict[UUID, KanbanCard] = {}
        self.checklist: dict[UUID, KanbanChecklistItem] = {}
        self.comments: dict[UUID, KanbanComment] = {}
        self.attachments: dict[UUID, KanbanAttachment] = {}
        self.logs: list[KanbanActivityLog] = []
        self.files: set[UUID] = set()

    # Boards
    async def list_boards(self, **_kwargs):
        return list(self.boards.values())

    async def get_board(self, board_id: UUID):
        return self.boards.get(board_id)

    async def create_board(self, board: KanbanBoard):
        board.id = board.id or uuid4()
        self.boards[board.id] = board
        return board

    async def update_board(self, board: KanbanBoard):
        self.boards[board.id] = board
        return board

    # Columns
    async def list_columns(self, board_id: UUID, is_active=None):
        cols = [c for c in self.columns.values() if c.board_id == board_id]
        if is_active is not None:
            cols = [c for c in cols if c.is_active == is_active]
        return sorted(cols, key=lambda c: c.order_index)

    async def get_column(self, column_id: UUID):
        return self.columns.get(column_id)

    async def create_column(self, column: KanbanColumn):
        column.id = column.id or uuid4()
        self.columns[column.id] = column
        return column

    async def update_column(self, column: KanbanColumn):
        self.columns[column.id] = column
        return column

    async def delete_column(self, column: KanbanColumn):
        self.columns.pop(column.id, None)

    async def count_cards_in_column(self, column_id: UUID) -> int:
        return len([c for c in self.cards.values() if c.column_id == column_id and c.deleted_at is None])

    # Cards
    async def list_cards(self, **kwargs):
        board_id = kwargs["board_id"]
        column_id = kwargs.get("column_id")
        cards = [c for c in self.cards.values() if c.board_id == board_id and c.deleted_at is None]
        if column_id:
            cards = [c for c in cards if c.column_id == column_id]
        return cards

    async def get_card(self, card_id: UUID):
        return self.cards.get(card_id)

    async def create_card(self, card: KanbanCard):
        card.id = card.id or uuid4()
        self.cards[card.id] = card
        return card

    async def update_card(self, card: KanbanCard):
        self.cards[card.id] = card
        return card

    async def soft_delete_card(self, card: KanbanCard):
        card.deleted_at = card.deleted_at or datetime.now(UTC)
        self.cards[card.id] = card
        return card

    # Activity
    async def create_activity_log(self, log: KanbanActivityLog):
        log.id = log.id or uuid4()
        self.logs.append(log)
        return log

    async def get_card_activity(self, card_id: UUID, limit: int = 50):
        return [log for log in self.logs if log.card_id == card_id][:limit]

    # Checklist
    async def get_checklist_items(self, card_id: UUID):
        return [i for i in self.checklist.values() if i.card_id == card_id]

    async def get_checklist_item(self, item_id: UUID):
        return self.checklist.get(item_id)

    async def create_checklist_item(self, item: KanbanChecklistItem):
        item.id = item.id or uuid4()
        self.checklist[item.id] = item
        return item

    async def update_checklist_item(self, item: KanbanChecklistItem):
        self.checklist[item.id] = item
        return item

    async def delete_checklist_item(self, item: KanbanChecklistItem):
        self.checklist.pop(item.id, None)

    # Comments
    async def get_comments(self, card_id: UUID):
        return [c for c in self.comments.values() if c.card_id == card_id and c.deleted_at is None]

    async def get_comment(self, comment_id: UUID):
        return self.comments.get(comment_id)

    async def create_comment(self, comment: KanbanComment):
        comment.id = comment.id or uuid4()
        self.comments[comment.id] = comment
        return comment

    async def update_comment(self, comment: KanbanComment):
        self.comments[comment.id] = comment
        return comment

    async def soft_delete_comment(self, comment: KanbanComment):
        comment.deleted_at = comment.deleted_at or datetime.now(UTC)
        self.comments[comment.id] = comment
        return comment

    # Attachments
    async def get_attachments(self, card_id: UUID):
        return [a for a in self.attachments.values() if a.card_id == card_id]

    async def get_attachment(self, attachment_id: UUID):
        return self.attachments.get(attachment_id)

    async def create_attachment(self, attachment: KanbanAttachment):
        attachment.id = attachment.id or uuid4()
        self.attachments[attachment.id] = attachment
        return attachment

    async def delete_attachment(self, attachment: KanbanAttachment):
        self.attachments.pop(attachment.id, None)

    async def file_exists(self, file_id: UUID) -> bool:
        return file_id in self.files

    async def attachment_exists(self, card_id: UUID, file_id: UUID) -> bool:
        return any(a.card_id == card_id and a.file_id == file_id for a in self.attachments.values())


@pytest.fixture()
def actor_admin() -> User:
    return User(
        id=uuid4(),
        username="Admin",
        name="Administrador",
        password_hash="hash",
        status="active",
        is_superuser=True,
    )


def test_list_boards_requires_login():
    with TestClient(app) as client:
        response = client.get("/api/kanban/boards")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_board_requires_permission(monkeypatch):
    user = User(id=uuid4(), username="u", name="U", password_hash="x", status="active", is_superuser=False)
    dependency = require_permission("kanban.board.create")

    async def fake_get_user_permissions(_session, _user):
        return {"kanban.view"}

    monkeypatch.setattr("app.core.permissions.get_user_permissions", fake_get_user_permissions)
    with pytest.raises(HTTPException) as exc:
        await dependency(current_user=user, session=None)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_creates_board(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    emitted: list[tuple[str, dict]] = []

    async def fake_publish(event_type, payload, publish_to_user_id=None):
        emitted.append((event_type, payload))

    async def fake_audit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(events, "publish_kanban_event", fake_publish)
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)

    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]
    board = await service.create_board(
        {"key": "producao", "name": "Producao", "board_type": "production", "metadata": {}},
        actor_admin,
    )
    assert board.created_by == actor_admin.id
    assert any(e[0] == events.KANBAN_BOARD_CREATED for e in emitted)


@pytest.mark.asyncio
async def test_create_column_in_existing_board(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    board = KanbanBoard(id=uuid4(), key="k", name="B", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    repo.boards[board.id] = board
    async def fake_audit(*_a, **_k):
        return None
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)
    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]
    column = await service.create_column(board.id, {"name": "Fila", "order_index": 1, "metadata": {}}, actor_admin)
    assert column.board_id == board.id


@pytest.mark.asyncio
async def test_create_card_and_prevent_cross_board_column(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    board_a = KanbanBoard(id=uuid4(), key="a", name="A", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    board_b = KanbanBoard(id=uuid4(), key="b", name="B", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    repo.boards[board_a.id] = board_a
    repo.boards[board_b.id] = board_b
    col_b = KanbanColumn(id=uuid4(), board_id=board_b.id, name="C", order_index=1, is_done=False, is_active=True, metadata_json={})
    repo.columns[col_b.id] = col_b

    async def fake_audit(*_a, **_k):
        return None
    async def fake_publish(*_a, **_k):
        return None
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)
    monkeypatch.setattr(events, "publish_kanban_event", fake_publish)
    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]

    with pytest.raises(HTTPException) as exc:
        await service.create_card(
            {"board_id": board_a.id, "column_id": col_b.id, "title": "X", "priority": "medium", "metadata": {}},
            actor_admin,
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_move_card_updates_column_and_generates_activity_and_event(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    board = KanbanBoard(id=uuid4(), key="b", name="B", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    repo.boards[board.id] = board
    col_from = KanbanColumn(id=uuid4(), board_id=board.id, name="From", order_index=1, is_done=False, is_active=True, metadata_json={})
    col_to = KanbanColumn(id=uuid4(), board_id=board.id, name="To", order_index=2, is_done=False, is_active=True, metadata_json={})
    repo.columns[col_from.id] = col_from
    repo.columns[col_to.id] = col_to
    card = KanbanCard(
        id=uuid4(),
        board_id=board.id,
        column_id=col_from.id,
        title="Card",
        priority="medium",
        order_index=1,
        is_archived=False,
        metadata_json={},
    )
    repo.cards[card.id] = card

    emitted: list[tuple[str, dict]] = []

    async def fake_publish(event_type, payload, publish_to_user_id=None):
        emitted.append((event_type, payload))

    async def fake_audit(*_a, **_k):
        return None
    monkeypatch.setattr(events, "publish_kanban_event", fake_publish)
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)
    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]

    moved = await service.move_card(card.id, col_to.id, 2, actor_admin)
    assert moved.column_id == col_to.id
    assert any(log.action == "card.moved" for log in repo.logs)
    assert any(e[0] == events.KANBAN_CARD_MOVED for e in emitted)


@pytest.mark.asyncio
async def test_move_card_reorders_within_same_column(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    board = KanbanBoard(id=uuid4(), key="b", name="B", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    repo.boards[board.id] = board
    col = KanbanColumn(id=uuid4(), board_id=board.id, name="C", order_index=1, is_done=False, is_active=True, metadata_json={})
    repo.columns[col.id] = col

    cards = [
        KanbanCard(id=uuid4(), board_id=board.id, column_id=col.id, title="C0", priority="medium", order_index=0, is_archived=False, metadata_json={}),
        KanbanCard(id=uuid4(), board_id=board.id, column_id=col.id, title="C1", priority="medium", order_index=1, is_archived=False, metadata_json={}),
        KanbanCard(id=uuid4(), board_id=board.id, column_id=col.id, title="C2", priority="medium", order_index=2, is_archived=False, metadata_json={}),
    ]
    for c in cards:
        repo.cards[c.id] = c

    async def fake_publish(*_a, **_k):
        return None

    async def fake_audit(*_a, **_k):
        return None

    monkeypatch.setattr(events, "publish_kanban_event", fake_publish)
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)
    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]

    moved = await service.move_card(cards[2].id, col.id, 0, actor_admin)
    assert moved.column_id == col.id
    assert moved.order_index == 0

    # ordem deve ficar normalizada 0..n-1
    reordered = [c for c in repo.cards.values() if c.column_id == col.id and c.deleted_at is None]
    reordered.sort(key=lambda x: x.order_index)
    assert [c.title for c in reordered] == ["C2", "C0", "C1"]
    assert [c.order_index for c in reordered] == [0, 1, 2]


@pytest.mark.asyncio
async def test_create_comment_and_checklist_and_mark_done(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    board = KanbanBoard(id=uuid4(), key="b", name="B", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    col = KanbanColumn(id=uuid4(), board_id=board.id, name="C", order_index=1, is_done=False, is_active=True, metadata_json={})
    card = KanbanCard(id=uuid4(), board_id=board.id, column_id=col.id, title="Card", priority="medium", order_index=1, is_archived=False, metadata_json={})
    repo.boards[board.id] = board
    repo.columns[col.id] = col
    repo.cards[card.id] = card

    async def fake_audit(*_a, **_k):
        return None
    async def fake_publish(*_a, **_k):
        return None
    monkeypatch.setattr(events, "publish_kanban_event", fake_publish)
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)
    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]

    comment = await service.create_comment(card.id, "Oi", actor_admin)
    assert comment.card_id == card.id

    item = await service.create_checklist_item(card.id, {"title": "Passo 1", "order_index": 1}, actor_admin)
    updated = await service.update_checklist_item(item.id, {"is_done": True}, actor_admin)
    assert updated.is_done is True
    assert updated.done_by == actor_admin.id
    assert updated.done_at is not None


@pytest.mark.asyncio
async def test_attach_existing_file_and_soft_delete_card_and_list_activity(actor_admin, monkeypatch):
    repo = FakeKanbanRepo()
    board = KanbanBoard(id=uuid4(), key="b", name="B", board_type="custom", is_active=True, is_archived=False, metadata_json={})
    col = KanbanColumn(id=uuid4(), board_id=board.id, name="C", order_index=1, is_done=False, is_active=True, metadata_json={})
    card = KanbanCard(id=uuid4(), board_id=board.id, column_id=col.id, title="Card", priority="medium", order_index=1, is_archived=False, metadata_json={})
    repo.boards[board.id] = board
    repo.columns[col.id] = col
    repo.cards[card.id] = card

    file_id = uuid4()
    repo.files.add(file_id)

    async def fake_audit(*_a, **_k):
        return None
    async def fake_publish(*_a, **_k):
        return None
    monkeypatch.setattr(events, "publish_kanban_event", fake_publish)
    monkeypatch.setattr("app.modules.kanban.service.write_audit_log", fake_audit)
    service = KanbanService(session=None, repo=repo)  # type: ignore[arg-type]

    attachment = await service.create_attachment(card.id, file_id, actor_admin)
    assert attachment.file_id == file_id

    deleted = await service.soft_delete_card(card.id, actor_admin)
    assert deleted.deleted_at is not None

    activity = await service.card_activity(card.id)
    assert isinstance(activity, list)
