"""Authentication and authorization dependencies."""

from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.security import decode_access_token
from app.models import Permission, PortalModule, RolePermission, User, UserPermission, UserRole

bearer_scheme = HTTPBearer(auto_error=True)
optional_bearer_scheme = HTTPBearer(auto_error=False)


def unauthorized(detail: str = "Credenciais invalidas ou expiradas") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    settings = get_settings()
    try:
        payload = decode_access_token(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            settings.JWT_ALGORITHM,
        )
    except ExpiredSignatureError as exc:
        raise unauthorized("Token expirado") from exc
    except JWTError as exc:
        raise unauthorized() from exc

    user_id = payload.get("sub")
    if not user_id:
        raise unauthorized()

    user = await session.get(User, UUID(user_id))
    if user is None or user.status != "active":
        raise unauthorized()
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None


async def get_user_permissions(session: AsyncSession, user: User) -> set[str]:
    if user.is_superuser:
        result = await session.execute(select(Permission.key))
        return {key for (key,) in result.all()}

    role_stmt = (
        select(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user.id)
    )
    direct_stmt = (
        select(Permission.key)
        .join(UserPermission, UserPermission.permission_id == Permission.id)
        .where(UserPermission.user_id == user.id)
    )
    role_result = await session.execute(role_stmt)
    direct_result = await session.execute(direct_stmt)
    return {key for (key,) in role_result.all()} | {key for (key,) in direct_result.all()}


def require_permission(permission_key: str):
    async def dependency(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> User:
        if current_user.is_superuser:
            return current_user
        permissions = await get_user_permissions(session, current_user)
        if permission_key not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": f"Permissao obrigatoria: {permission_key}"},
            )
        return current_user

    return dependency


def require_module_access(module_key: str):
    async def dependency(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session),
    ) -> User:
        if current_user.is_superuser:
            return current_user

        module = await session.scalar(
            select(PortalModule).where(
                PortalModule.key == module_key,
                PortalModule.enabled.is_(True),
            )
        )
        if module is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modulo nao encontrado")

        permissions = await get_user_permissions(session, current_user)
        if f"{module_key}.view" not in permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Modulo nao liberado")
        return current_user

    return dependency
