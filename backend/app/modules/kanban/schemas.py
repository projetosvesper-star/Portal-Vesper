"""Pydantic schemas for Kanban Engine."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class BoardCreate(BaseModel):
    key: str | None = None
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    board_type: str = Field(..., pattern="^(production|projects|operational|helpdesk|custom)$")
    module_context: str | None = None
    color: str | None = Field(None, max_length=20)
    icon: str | None = Field(None, max_length=50)
    metadata: dict[str, Any] = Field(default_factory=dict)


class BoardUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    color: str | None = Field(None, max_length=20)
    icon: str | None = Field(None, max_length=50)
    is_active: bool | None = None
    metadata: dict[str, Any] = None


class BoardRead(BaseModel):
    id: UUID
    key: str | None
    name: str
    description: str | None
    board_type: str
    module_context: str | None
    color: str | None
    icon: str | None
    is_active: bool
    is_archived: bool
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime
    archived_at: datetime | None
    metadata: dict[str, Any]

    class Config:
        from_attributes = True


class ColumnCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    key: str | None = Field(None, max_length=80)
    description: str | None = None
    order_index: int = Field(..., ge=0)
    color: str | None = Field(None, max_length=20)
    wip_limit: int | None = Field(None, ge=0)
    is_done: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class ColumnUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    order_index: int | None = Field(None, ge=0)
    color: str | None = Field(None, max_length=20)
    wip_limit: int | None = Field(None, ge=0)
    is_done: bool | None = None
    is_active: bool | None = None
    metadata: dict[str, Any] = None


class ColumnRead(BaseModel):
    id: UUID
    board_id: UUID
    name: str
    key: str | None
    description: str | None
    order_index: int
    color: str | None
    wip_limit: int | None
    is_done: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any]

    class Config:
        from_attributes = True


class ColumnReorderRequest(BaseModel):
    column_orders: list[tuple[UUID, int]] = Field(..., description="List of (column_id, new_order_index)")


class CardTypeCreate(BaseModel):
    board_id: UUID | None = None
    key: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    color: str | None = Field(None, max_length=20)
    icon: str | None = Field(None, max_length=50)
    schema: dict[str, Any] = Field(default_factory=dict)


class CardTypeUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    color: str | None = Field(None, max_length=20)
    icon: str | None = Field(None, max_length=50)
    schema: dict[str, Any] = None
    is_active: bool | None = None


class CardTypeRead(BaseModel):
    id: UUID
    board_id: UUID | None
    key: str
    name: str
    description: str | None
    color: str | None
    icon: str | None
    schema: dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CardCreate(BaseModel):
    board_id: UUID
    column_id: UUID
    card_type_id: UUID | None = None
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    code: str | None = Field(None, max_length=80)
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    status: str | None = Field(None, max_length=50)
    order_index: int = Field(default=0, ge=0)
    due_date: datetime | None = None
    start_date: datetime | None = None
    assigned_to: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class CardUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    code: str | None = Field(None, max_length=80)
    priority: str | None = Field(None, pattern="^(low|medium|high|critical)$")
    status: str | None = Field(None, max_length=50)
    order_index: int | None = Field(None, ge=0)
    due_date: datetime | None = None
    start_date: datetime | None = None
    assigned_to: UUID | None = None
    metadata: dict[str, Any] = None


class CardRead(BaseModel):
    id: UUID
    board_id: UUID
    column_id: UUID
    card_type_id: UUID | None
    title: str
    description: str | None
    code: str | None
    priority: str
    status: str | None
    order_index: int
    due_date: datetime | None
    start_date: datetime | None
    completed_at: datetime | None
    created_by: UUID | None
    assigned_to: UUID | None
    is_archived: bool
    archived_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any]

    class Config:
        from_attributes = True


class CardMoveRequest(BaseModel):
    to_column_id: UUID
    new_order_index: int = Field(..., ge=0)


class CardAssigneeCreate(BaseModel):
    user_id: UUID
    role: str | None = Field(None, max_length=50)


class CardAssigneeRead(BaseModel):
    id: UUID
    card_id: UUID
    user_id: UUID
    role: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ChecklistItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    order_index: int = Field(default=0, ge=0)


class ChecklistItemUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    is_done: bool | None = None
    order_index: int | None = Field(None, ge=0)


class ChecklistItemRead(BaseModel):
    id: UUID
    card_id: UUID
    title: str
    description: str | None
    is_done: bool
    order_index: int
    done_by: UUID | None
    done_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentRead(BaseModel):
    id: UUID
    card_id: UUID
    user_id: UUID
    content: str
    edited_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttachmentCreate(BaseModel):
    file_id: UUID


class AttachmentRead(BaseModel):
    id: UUID
    card_id: UUID
    file_id: UUID
    uploaded_by: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogRead(BaseModel):
    id: UUID
    board_id: UUID | None
    card_id: UUID | None
    user_id: UUID | None
    action: str
    old_value: dict[str, Any] | None
    new_value: dict[str, Any] | None
    metadata: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class BoardPermissionCreate(BaseModel):
    user_id: UUID | None = None
    role_id: UUID | None = None
    permission_key: str = Field(..., min_length=1, max_length=120)


class BoardPermissionRead(BaseModel):
    id: UUID
    board_id: UUID
    user_id: UUID | None
    role_id: UUID | None
    permission_key: str
    created_at: datetime

    class Config:
        from_attributes = True
