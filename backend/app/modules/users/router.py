"""Public user lookup/search endpoints (safe for non-admin UIs)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.permissions import get_current_user
from app.models import User
from app.schemas.auth import UserLookupRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/search", response_model=list[UserLookupRead])
async def search_users(
    q: str = Query("", max_length=80),
    limit: int = Query(20, ge=1, le=50),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[UserLookupRead]:
    query = select(User).where(User.status == "active")
    q = q.strip()
    if q:
        like = f"%{q}%"
        query = query.where(or_(User.name.ilike(like), User.username.ilike(like)))
    rows = (await session.execute(query.order_by(User.name).limit(limit))).scalars().all()
    return [UserLookupRead.model_validate(u) for u in rows]


@router.get("/lookup", response_model=list[UserLookupRead])
async def lookup_users(
    ids: str = Query("", description="Lista de UUIDs separados por virgula"),
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[UserLookupRead]:
    raw = [part.strip() for part in (ids or "").split(",") if part.strip()]
    if not raw:
        return []
    # limite defensivo
    raw = raw[:50]
    parsed: list[UUID] = []
    for value in raw:
        try:
            parsed.append(UUID(value))
        except Exception:
            continue
    if not parsed:
        return []
    rows = (await session.execute(select(User).where(User.id.in_(parsed)))).scalars().all()
    by_id = {u.id: u for u in rows}
    # tenta preservar ordem dos ids fornecidos
    ordered = [by_id.get(uid) for uid in parsed if by_id.get(uid)]
    return [UserLookupRead.model_validate(u) for u in ordered]

