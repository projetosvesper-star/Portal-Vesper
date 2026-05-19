"""Eventos do Kanban Producao."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.redis import STREAM_MODULE_EVENTS, add_stream_event, publish_module, publish_user
from app.modules.kanban.events import publish_kanban_event

MODULE_KEY = "kanban_producao"

PRODUCTION_OP_CREATED = "kanban_producao.op.created"
PRODUCTION_OP_UPDATED = "kanban_producao.op.updated"
PRODUCTION_OP_ARCHIVED = "kanban_producao.op.archived"
PRODUCTION_OP_RESTORED = "kanban_producao.op.restored"
PRODUCTION_OP_DELETED = "kanban_producao.op.deleted"
PRODUCTION_CHECKLIST_ITEM_CREATED = "kanban_producao.checklist.item.created"
PRODUCTION_CHECKLIST_ITEM_UPDATED = "kanban_producao.checklist.item.updated"
PRODUCTION_CHECKLIST_ITEM_DELETED = "kanban_producao.checklist.item.deleted"
PRODUCTION_CHECKLIST_REORDERED = "kanban_producao.checklist.reordered"
PRODUCTION_TEMPLATE_CREATED = "kanban_producao.template.created"
PRODUCTION_TEMPLATE_UPDATED = "kanban_producao.template.updated"
PRODUCTION_TEMPLATE_DELETED = "kanban_producao.template.deleted"
PRODUCTION_TV_UPDATED = "kanban_producao.tv.updated"


def build_event(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {"type": event_type, "payload": payload, "timestamp": datetime.now(UTC).isoformat()}


async def publish_production_event(
    event_type: str,
    payload: dict[str, Any],
    *,
    actor_user_id: str | None = None,
    publish_kanban_changed: bool = False,
) -> None:
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
        if actor_user_id:
            await publish_user(actor_user_id, event)
        if publish_kanban_changed:
            await publish_kanban_event("kanban.card.updated", payload, publish_to_user_id=actor_user_id)
    except Exception:
        # Eventos nunca devem quebrar a operacao principal.
        pass
