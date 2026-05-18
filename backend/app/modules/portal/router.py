"""Current-user and portal module endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.permissions import get_current_user, get_user_permissions
from app.models import PortalModule, User
from app.schemas.auth import PortalModuleRead, UserRead

router = APIRouter(tags=["Portal"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/me/permissions", response_model=list[str])
async def my_permissions(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[str]:
    return sorted(await get_user_permissions(session, current_user))


@router.get("/me/modules", response_model=list[PortalModuleRead])
async def my_modules(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[PortalModuleRead]:
    stmt = select(PortalModule).where(PortalModule.enabled.is_(True)).order_by(PortalModule.order_index)
    modules = list((await session.execute(stmt)).scalars().all())
    if current_user.is_superuser:
        return [PortalModuleRead.model_validate(module) for module in modules]

    permissions = await get_user_permissions(session, current_user)
    allowed = [module for module in modules if f"{module.key}.view" in permissions]
    return [PortalModuleRead.model_validate(module) for module in allowed]


@router.get("/modules", response_model=list[PortalModuleRead])
async def public_modules(session: AsyncSession = Depends(get_session)) -> list[PortalModuleRead]:
    modules = (await session.execute(select(PortalModule).where(PortalModule.enabled.is_(True)).order_by(PortalModule.order_index))).scalars().all()
    return [PortalModuleRead.model_validate(module) for module in modules]
