"""Notification service with database, Redis Stream and WebSocket event integration."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import STREAM_NOTIFICATIONS, add_stream_event, publish_user
from app.models import Notification


async def create_notification(
    session: AsyncSession,
    user_id: UUID,
    title: str,
    message: str,
    type_: str = "info",
    metadata: dict | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type_,
        metadata_json=metadata or {},
    )
    session.add(notification)
    await session.flush()

    event = {
        "type": "system.notification.created",
        "payload": {
            "id": str(notification.id),
            "user_id": str(user_id),
            "title": title,
            "message": message,
            "notification_type": type_,
            "metadata": metadata or {},
        },
    }
    try:
        await add_stream_event(STREAM_NOTIFICATIONS, event)
        await publish_user(str(user_id), event)
    except Exception:
        pass
    return notification
