"""Notification endpoints."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.permissions import get_current_user, require_permission
from app.models import Notification, User
from app.schemas.auth import NotificationRead

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def notification_to_read(notification: Notification) -> NotificationRead:
    return NotificationRead(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        type=notification.type,
        read_at=notification.read_at,
        metadata=notification.metadata_json,
        created_at=notification.created_at,
    )


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    current_user: User = Depends(require_permission("system.notifications.view")),
    session: AsyncSession = Depends(get_session),
) -> list[NotificationRead]:
    notifications = (
        await session.execute(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [notification_to_read(item) for item in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> NotificationRead:
    notification = await session.get(Notification, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notificacao nao encontrada")
    notification.read_at = datetime.now(UTC)
    return notification_to_read(notification)
