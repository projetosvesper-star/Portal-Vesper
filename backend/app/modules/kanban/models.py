"""SQLAlchemy models for Kanban Engine."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base, TimestampMixin


class KanbanBoard(Base, TimestampMixin):
    __tablename__ = "kanban_boards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    board_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    module_context: Mapped[str | None] = mapped_column(String(80), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    columns: Mapped[list[KanbanColumn]] = relationship(back_populates="board", cascade="all, delete-orphan")
    card_types: Mapped[list[KanbanCardType]] = relationship(back_populates="board", cascade="all, delete-orphan")
    cards: Mapped[list[KanbanCard]] = relationship(back_populates="board", cascade="all, delete-orphan")
    activity_logs: Mapped[list[KanbanActivityLog]] = relationship(back_populates="board", cascade="all, delete-orphan")
    board_permissions: Mapped[list[KanbanBoardPermission]] = relationship(back_populates="board", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_kanban_boards_board_type", "board_type"),
        Index("ix_kanban_boards_is_active", "is_active"),
        Index("ix_kanban_boards_is_archived", "is_archived"),
        Index("ix_kanban_boards_created_by", "created_by"),
    )


class KanbanColumn(Base, TimestampMixin):
    __tablename__ = "kanban_columns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    key: Mapped[str | None] = mapped_column(String(80), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    wip_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    board: Mapped[KanbanBoard] = relationship(back_populates="columns")
    cards: Mapped[list[KanbanCard]] = relationship(back_populates="column", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_kanban_columns_board_id", "board_id"),
        Index("ix_kanban_columns_order_index", "order_index"),
        Index("ix_kanban_columns_is_done", "is_done"),
        Index("uq_kanban_columns_board_order", "board_id", "order_index", unique=True),
        Index("uq_kanban_columns_board_key", "board_id", "key", unique=True),
    )


class KanbanCardType(Base, TimestampMixin):
    __tablename__ = "kanban_card_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=True)
    key: Mapped[str] = mapped_column(String(80), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    schema_json: Mapped[dict] = mapped_column("schema", JSONB, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    board: Mapped[KanbanBoard | None] = relationship(back_populates="card_types")
    cards: Mapped[list[KanbanCard]] = relationship(back_populates="card_type")


class KanbanCard(Base, TimestampMixin):
    __tablename__ = "kanban_cards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False, index=True)
    column_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_columns.id", ondelete="RESTRICT"), nullable=False, index=True)
    card_type_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_card_types.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    code: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    board: Mapped[KanbanBoard] = relationship(back_populates="cards")
    column: Mapped[KanbanColumn] = relationship(back_populates="cards")
    card_type: Mapped[KanbanCardType | None] = relationship(back_populates="cards")
    assignees: Mapped[list[KanbanCardAssignee]] = relationship(back_populates="card", cascade="all, delete-orphan")
    checklist_items: Mapped[list[KanbanChecklistItem]] = relationship(back_populates="card", cascade="all, delete-orphan")
    comments: Mapped[list[KanbanComment]] = relationship(back_populates="card", cascade="all, delete-orphan")
    attachments: Mapped[list[KanbanAttachment]] = relationship(back_populates="card", cascade="all, delete-orphan")
    activity_logs: Mapped[list[KanbanActivityLog]] = relationship(back_populates="card", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_kanban_cards_board_id", "board_id"),
        Index("ix_kanban_cards_column_id", "column_id"),
        Index("ix_kanban_cards_card_type_id", "card_type_id"),
        Index("ix_kanban_cards_assigned_to", "assigned_to"),
        Index("ix_kanban_cards_created_by", "created_by"),
        Index("ix_kanban_cards_priority", "priority"),
        Index("ix_kanban_cards_due_date", "due_date"),
        Index("ix_kanban_cards_is_archived", "is_archived"),
        Index("ix_kanban_cards_deleted_at", "deleted_at"),
        Index("ix_kanban_cards_code", "code"),
    )


class KanbanCardAssignee(Base):
    __tablename__ = "kanban_card_assignees"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    card: Mapped[KanbanCard] = relationship(back_populates="assignees")

    __table_args__ = (Index("uq_kanban_card_assignees_card_user", "card_id", "user_id", unique=True),)


class KanbanChecklistItem(Base, TimestampMixin):
    __tablename__ = "kanban_checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    done_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    card: Mapped[KanbanCard] = relationship(back_populates="checklist_items")

    __table_args__ = (
        Index("ix_kanban_checklist_items_card_id", "card_id"),
        Index("ix_kanban_checklist_items_is_done", "is_done"),
        Index("ix_kanban_checklist_items_order_index", "order_index"),
    )


class KanbanComment(Base, TimestampMixin):
    __tablename__ = "kanban_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    card: Mapped[KanbanCard] = relationship(back_populates="comments")

    __table_args__ = (
        Index("ix_kanban_comments_card_id", "card_id"),
        Index("ix_kanban_comments_user_id", "user_id"),
        Index("ix_kanban_comments_created_at", "created_at"),
    )


class KanbanAttachment(Base):
    __tablename__ = "kanban_attachments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=False)
    file_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    card: Mapped[KanbanCard] = relationship(back_populates="attachments")

    __table_args__ = (Index("uq_kanban_attachments_card_file", "card_id", "file_id", unique=True),)


class KanbanActivityLog(Base):
    __tablename__ = "kanban_activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=True)
    card_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    old_value_json: Mapped[dict | None] = mapped_column("old_value", JSONB, nullable=True)
    new_value_json: Mapped[dict | None] = mapped_column("new_value", JSONB, nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    board: Mapped[KanbanBoard | None] = relationship(back_populates="activity_logs")
    card: Mapped[KanbanCard | None] = relationship(back_populates="activity_logs")


class KanbanBoardPermission(Base):
    __tablename__ = "kanban_board_permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    role_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=True)
    permission_key: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    board: Mapped[KanbanBoard] = relationship(back_populates="board_permissions")

    __table_args__ = (
        Index("uq_kanban_board_permissions_board_user_permission", "board_id", "user_id", "permission_key", unique=True),
        Index("uq_kanban_board_permissions_board_role_permission", "board_id", "role_id", "permission_key", unique=True),
    )
