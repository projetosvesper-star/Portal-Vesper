"""Eventos do Kanban Engine (Redis Stream + Pub/Sub / WebSocket)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from app.core.redis import STREAM_MODULE_EVENTS, add_stream_event, publish_module, publish_user

MODULE_KEY = "kanban"

# Event names
KANBAN_BOARD_CREATED = "kanban.board.created"
KANBAN_BOARD_UPDATED = "kanban.board.updated"
KANBAN_BOARD_ARCHIVED = "kanban.board.archived"
KANBAN_COLUMN_CREATED = "kanban.column.created"
KANBAN_COLUMN_UPDATED = "kanban.column.updated"
KANBAN_COLUMN_REORDERED = "kanban.column.reordered"
KANBAN_CARD_CREATED = "kanban.card.created"
KANBAN_CARD_UPDATED = "kanban.card.updated"
KANBAN_CARD_MOVED = "kanban.card.moved"
KANBAN_CARD_ARCHIVED = "kanban.card.archived"
KANBAN_CARD_RESTORED = "kanban.card.restored"
KANBAN_CARD_DELETED = "kanban.card.deleted"
KANBAN_CARD_ASSIGNED = "kanban.card.assigned"
KANBAN_COMMENT_CREATED = "kanban.comment.created"
KANBAN_COMMENT_UPDATED = "kanban.comment.updated"
KANBAN_COMMENT_DELETED = "kanban.comment.deleted"
KANBAN_CHECKLIST_CREATED = "kanban.checklist.created"
KANBAN_CHECKLIST_UPDATED = "kanban.checklist.updated"
KANBAN_ATTACHMENT_CREATED = "kanban.attachment.created"
KANBAN_ATTACHMENT_DELETED = "kanban.attachment.deleted"


def build_event(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": event_type,
        "payload": payload,
        "timestamp": datetime.now(UTC).isoformat(),
    }


async def publish_kanban_event(
    event_type: str,
    payload: dict[str, Any],
    publish_to_user_id: str | None = None,
) -> None:
    """Publica no stream padrao de eventos do portal e nos canais WebSocket do Kanban."""
    event = build_event(event_type, payload)
    try:
        await add_stream_event(
            STREAM_MODULE_EVENTS,
            {
                "module_key": MODULE_KEY,
                "type": event["type"],
                "payload": event["payload"],
                "timestamp": event["timestamp"],
            },
        )
        await publish_module(MODULE_KEY, event)
        if publish_to_user_id:
            await publish_user(publish_to_user_id, event)
    except Exception:
        # Eventos nunca devem quebrar a operacao de negocio.
        pass


async def publish_board_created(
    board_id: UUID,
    board_key: str | None,
    board_name: str,
    board_type: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_BOARD_CREATED,
        {
            "board_id": str(board_id),
            "board_key": board_key,
            "board_name": board_name,
            "board_type": board_type,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_board_updated(
    board_id: UUID,
    board_name: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_BOARD_UPDATED,
        {
            "board_id": str(board_id),
            "board_name": board_name,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_board_archived(
    board_id: UUID,
    board_name: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_BOARD_ARCHIVED,
        {
            "board_id": str(board_id),
            "board_name": board_name,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_column_created(
    board_id: UUID,
    column_id: UUID,
    column_name: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_COLUMN_CREATED,
        {
            "board_id": str(board_id),
            "column_id": str(column_id),
            "column_name": column_name,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_column_updated(
    board_id: UUID,
    column_id: UUID,
    column_name: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_COLUMN_UPDATED,
        {
            "board_id": str(board_id),
            "column_id": str(column_id),
            "column_name": column_name,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_column_reordered(
    board_id: UUID,
    column_orders: list[tuple[UUID, int]],
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_COLUMN_REORDERED,
        {
            "board_id": str(board_id),
            "column_orders": [(str(cid), order) for cid, order in column_orders],
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_created(
    board_id: UUID,
    card_id: UUID,
    column_id: UUID,
    card_title: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_CREATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "column_id": str(column_id),
            "card_title": card_title,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_updated(
    board_id: UUID,
    card_id: UUID,
    card_title: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_UPDATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "card_title": card_title,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_moved(
    board_id: UUID,
    card_id: UUID,
    from_column_id: UUID,
    to_column_id: UUID,
    old_order_index: int,
    new_order_index: int,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_MOVED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "from_column_id": str(from_column_id),
            "to_column_id": str(to_column_id),
            "old_order_index": old_order_index,
            "new_order_index": new_order_index,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_archived(
    board_id: UUID,
    card_id: UUID,
    card_title: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_ARCHIVED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "card_title": card_title,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_restored(
    board_id: UUID,
    card_id: UUID,
    card_title: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_RESTORED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "card_title": card_title,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_deleted(
    board_id: UUID,
    card_id: UUID,
    card_title: str,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_DELETED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "card_title": card_title,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_card_assigned(
    board_id: UUID,
    card_id: UUID,
    card_title: str,
    assigned_user_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CARD_ASSIGNED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "card_title": card_title,
            "assigned_user_id": str(assigned_user_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_comment_created(
    board_id: UUID,
    card_id: UUID,
    comment_id: UUID,
    user_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_COMMENT_CREATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "comment_id": str(comment_id),
            "user_id": str(user_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_comment_updated(
    board_id: UUID,
    card_id: UUID,
    comment_id: UUID,
    user_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_COMMENT_UPDATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "comment_id": str(comment_id),
            "user_id": str(user_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_comment_deleted(
    board_id: UUID,
    card_id: UUID,
    comment_id: UUID,
    user_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_COMMENT_DELETED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "comment_id": str(comment_id),
            "user_id": str(user_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_checklist_created(
    board_id: UUID,
    card_id: UUID,
    item_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CHECKLIST_CREATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "item_id": str(item_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_checklist_updated(
    board_id: UUID,
    card_id: UUID,
    item_id: UUID,
    is_done: bool,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_CHECKLIST_UPDATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "item_id": str(item_id),
            "is_done": is_done,
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_attachment_created(
    board_id: UUID,
    card_id: UUID,
    attachment_id: UUID,
    file_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_ATTACHMENT_CREATED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "attachment_id": str(attachment_id),
            "file_id": str(file_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )


async def publish_attachment_deleted(
    board_id: UUID,
    card_id: UUID,
    attachment_id: UUID,
    file_id: UUID,
    actor_user_id: UUID | None,
) -> None:
    await publish_kanban_event(
        KANBAN_ATTACHMENT_DELETED,
        {
            "board_id": str(board_id),
            "card_id": str(card_id),
            "attachment_id": str(attachment_id),
            "file_id": str(file_id),
            "actor_user_id": str(actor_user_id) if actor_user_id else None,
        },
        actor_user_id,
    )
