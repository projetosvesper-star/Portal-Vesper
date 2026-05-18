"""Initial administration endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.config import get_settings
from app.core.database import get_session
from app.core.permissions import require_permission
from app.core.security import create_access_token, hash_password
from app.models import AuditLog, Permission, PortalModule, Role, User
from app.schemas.auth import (
    AuditLogRead,
    PermissionRead,
    PortalModuleRead,
    PortalModuleUpdate,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserRead])
async def list_users(
    _: User = Depends(require_permission("admin.users.view")),
    session: AsyncSession = Depends(get_session),
) -> list[UserRead]:
    users = (await session.execute(select(User).order_by(User.name))).scalars().all()
    return [UserRead.model_validate(user) for user in users]


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_permission("admin.users.create")),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    if await session.scalar(select(User).where(User.username == payload.username)):
        raise HTTPException(status_code=409, detail="Username ja existe")
    roles = (await session.execute(select(Role).where(Role.key.in_(payload.role_keys)))).scalars().all()
    user = User(
        username=payload.username,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        department=payload.department,
        job_title=payload.job_title,
        status="active",
    )
    user.roles = list(roles)
    session.add(user)
    await session.flush()
    await write_audit_log(session, "admin.user.created", user_id=current_user.id, module_key="admin", entity_type="users", entity_id=user.id)
    return UserRead.model_validate(user)


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: UUID,
    _: User = Depends(require_permission("admin.users.view")),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    return UserRead.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    current_user: User = Depends(require_permission("admin.users.edit")),
    session: AsyncSession = Depends(get_session),
) -> UserRead:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    for field in ("name", "email", "department", "job_title", "status"):
        value = getattr(payload, field)
        if value is not None:
            setattr(user, field, value)
    if payload.role_keys is not None:
        roles = (await session.execute(select(Role).where(Role.key.in_(payload.role_keys)))).scalars().all()
        user.roles = list(roles)
    await write_audit_log(session, "admin.user.updated", user_id=current_user.id, module_key="admin", entity_type="users", entity_id=user.id)
    return UserRead.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_permission("admin.users.delete")),
    session: AsyncSession = Depends(get_session),
) -> dict:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    user.status = "inactive"
    await write_audit_log(session, "admin.user.disabled", user_id=current_user.id, module_key="admin", entity_type="users", entity_id=user.id)
    return {"message": "Usuario desativado"}


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(
    _: User = Depends(require_permission("admin.roles.view")),
    session: AsyncSession = Depends(get_session),
) -> list[RoleRead]:
    roles = (await session.execute(select(Role).order_by(Role.name))).scalars().all()
    return [RoleRead.model_validate(role) for role in roles]


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    current_user: User = Depends(require_permission("admin.roles.create")),
    session: AsyncSession = Depends(get_session),
) -> RoleRead:
    role = Role(key=payload.key, name=payload.name, description=payload.description)
    if payload.permission_keys:
        role.permissions = list((await session.execute(select(Permission).where(Permission.key.in_(payload.permission_keys)))).scalars().all())
    session.add(role)
    await session.flush()
    await write_audit_log(
        session,
        "admin.role.created",
        user_id=current_user.id,
        module_key="admin",
        entity_type="roles",
        entity_id=role.id,
        metadata={"permission_keys": payload.permission_keys},
    )
    return RoleRead.model_validate(role)


@router.patch("/roles/{role_id}", response_model=RoleRead)
async def update_role(
    role_id: UUID,
    payload: RoleUpdate,
    current_user: User = Depends(require_permission("admin.roles.edit")),
    session: AsyncSession = Depends(get_session),
) -> RoleRead:
    role = await session.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")
    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    if payload.permission_keys is not None:
        role.permissions = list((await session.execute(select(Permission).where(Permission.key.in_(payload.permission_keys)))).scalars().all())
    await write_audit_log(
        session,
        "admin.role.updated",
        user_id=current_user.id,
        module_key="admin",
        entity_type="roles",
        entity_id=role.id,
        metadata=payload.model_dump(exclude_unset=True),
    )
    return RoleRead.model_validate(role)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: UUID,
    current_user: User = Depends(require_permission("admin.roles.delete")),
    session: AsyncSession = Depends(get_session),
) -> dict:
    role = await session.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")
    if role.key == "administrador":
        raise HTTPException(status_code=400, detail="Perfil Administrador nao pode ser removido")
    await write_audit_log(
        session,
        "admin.role.deleted",
        user_id=current_user.id,
        module_key="admin",
        entity_type="roles",
        entity_id=role.id,
        metadata={"role_key": role.key},
    )
    await session.delete(role)
    return {"message": "Perfil removido"}


@router.get("/permissions", response_model=list[PermissionRead])
async def list_permissions(
    _: User = Depends(require_permission("admin.permissions.view")),
    session: AsyncSession = Depends(get_session),
) -> list[PermissionRead]:
    permissions = (await session.execute(select(Permission).order_by(Permission.key))).scalars().all()
    return [PermissionRead.model_validate(permission) for permission in permissions]


@router.get("/modules", response_model=list[PortalModuleRead])
async def list_modules(
    _: User = Depends(require_permission("admin.modules.view")),
    session: AsyncSession = Depends(get_session),
) -> list[PortalModuleRead]:
    modules = (await session.execute(select(PortalModule).order_by(PortalModule.order_index))).scalars().all()
    return [PortalModuleRead.model_validate(module) for module in modules]


@router.patch("/modules/{module_id}", response_model=PortalModuleRead)
async def update_module(
    module_id: UUID,
    payload: PortalModuleUpdate,
    current_user: User = Depends(require_permission("admin.modules.manage")),
    session: AsyncSession = Depends(get_session),
) -> PortalModuleRead:
    module = await session.get(PortalModule, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail="Modulo nao encontrado")
    for field in ("name", "description", "enabled", "order_index", "version"):
        value = getattr(payload, field)
        if value is not None:
            setattr(module, field, value)
    await write_audit_log(session, "admin.module.updated", user_id=current_user.id, module_key="admin", entity_type="portal_modules", entity_id=module.id)
    return PortalModuleRead.model_validate(module)


@router.get("/audit-logs", response_model=list[AuditLogRead])
async def list_audit_logs(
    _: User = Depends(require_permission("admin.audit.view")),
    session: AsyncSession = Depends(get_session),
) -> list[AuditLogRead]:
    rows = (await session.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200))).scalars().all()
    return [
        AuditLogRead(
            id=row.id,
            user_id=row.user_id,
            action=row.action,
            module_key=row.module_key,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            ip_address=row.ip_address,
            user_agent=row.user_agent,
            metadata=row.metadata_json,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.post("/view-as-user/{user_id}")
async def view_as_user(
    user_id: UUID,
    current_user: User = Depends(require_permission("admin.view_as_user")),
    session: AsyncSession = Depends(get_session),
) -> dict:
    target = await session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    settings = get_settings()
    token = create_access_token(
        current_user.id,
        current_user.username,
        settings.JWT_SECRET_KEY,
        settings.JWT_ALGORITHM,
        15,
        {"view_as_user_id": str(target.id), "view_as_username": target.username},
    )
    await write_audit_log(session, "admin.view_as_user", user_id=current_user.id, module_key="admin", entity_type="users", entity_id=target.id)
    return {"access_token": token, "token_type": "bearer", "expires_minutes": 15}
