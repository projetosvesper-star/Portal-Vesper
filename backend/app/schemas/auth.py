"""Pydantic schemas shared by the initial API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    name: str
    email: str | None = None
    avatar_url: str | None = None
    department: str | None = None
    job_title: str | None = None
    status: str
    is_superuser: bool
    last_login_at: datetime | None = None


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1)
    remember_me: bool = False


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=8)
    email: EmailStr | None = None
    department: str | None = None
    job_title: str | None = None
    role_keys: list[str] = []


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    department: str | None = None
    job_title: str | None = None
    status: str | None = None
    role_keys: list[str] | None = None


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    name: str
    description: str | None = None


class RoleCreate(BaseModel):
    key: str
    name: str
    description: str | None = None
    permission_keys: list[str] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_keys: list[str] | None = None


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    description: str
    module_key: str | None = None


class PortalModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    key: str
    name: str
    description: str | None = None
    route: str
    icon: str
    enabled: bool
    order_index: int
    version: str


class PortalModuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    enabled: bool | None = None
    order_index: int | None = None
    version: str | None = None


class AuditLogRead(BaseModel):
    id: UUID
    user_id: UUID | None = None
    action: str
    module_key: str | None = None
    entity_type: str | None = None
    entity_id: UUID | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class NotificationRead(BaseModel):
    id: UUID
    title: str
    message: str
    type: str
    read_at: datetime | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class FileRead(BaseModel):
    id: UUID
    owner_user_id: UUID | None = None
    module_key: str | None = None
    bucket: str
    object_key: str
    original_name: str
    content_type: str | None = None
    size_bytes: int
    checksum: str | None = None
    visibility: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class PresignedFileResponse(BaseModel):
    file: FileRead
    url: str
