"""Audit helper used by routers and future modules."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import STREAM_AUDIT, add_stream_event
from app.models import AuditLog


async def write_audit_log(
    session: AsyncSession,
    action: str,
    user_id: UUID | None = None,
    module_key: str | None = None,
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        module_key=module_key,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata_json=metadata or {},
    )
    session.add(audit_log)
    await session.flush()
    try:
        await add_stream_event(
            STREAM_AUDIT,
            {
                "id": audit_log.id,
                "user_id": user_id,
                "action": action,
                "module_key": module_key,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "metadata": metadata or {},
            },
        )
    except Exception:
        pass
    return audit_log
