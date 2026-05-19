"""SQLAlchemy models for the simple Kanban Producao foundation."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base, TimestampMixin


class ProductionOrder(Base, TimestampMixin):
    __tablename__ = "production_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), unique=True, nullable=False)
    board_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_boards.id", ondelete="CASCADE"), nullable=False, index=True)
    numero_op: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    cliente: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    projeto: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    modelo: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    quantidade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    setor: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_entrega: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    prioridade: Mapped[str] = mapped_column(String(20), default="normal", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="aberta", nullable=False, index=True)
    percentual_checklist: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    checklist_items: Mapped[list[ProductionOrderChecklistItem]] = relationship(back_populates="production_order", cascade="all, delete-orphan")
    activity_logs: Mapped[list[ProductionOrderActivityLog]] = relationship(back_populates="production_order", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_production_orders_card_id", "card_id", unique=True),
        Index("ix_production_orders_board_id", "board_id"),
        Index("ix_production_orders_cliente", "cliente"),
        Index("ix_production_orders_projeto", "projeto"),
        Index("ix_production_orders_modelo", "modelo"),
        Index("ix_production_orders_setor", "setor"),
        Index("ix_production_orders_data_entrega", "data_entrega"),
        Index("ix_production_orders_prioridade", "prioridade"),
        Index("ix_production_orders_status", "status"),
        Index("ix_production_orders_is_archived", "is_archived"),
        Index("ix_production_orders_deleted_at", "deleted_at"),
    )


class ProductionChecklistTemplate(Base, TimestampMixin):
    __tablename__ = "production_checklist_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_type: Mapped[str] = mapped_column(String(40), default="producao", nullable=False, index=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    items: Mapped[list[ProductionChecklistTemplateItem]] = relationship(back_populates="template", cascade="all, delete-orphan")


class ProductionChecklistTemplateItem(Base, TimestampMixin):
    __tablename__ = "production_checklist_template_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_checklist_templates.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    template: Mapped[ProductionChecklistTemplate] = relationship(back_populates="items")

    __table_args__ = (
        UniqueConstraint("template_id", "order_index", name="uq_production_template_items_template_order"),
    )


class ProductionOrderChecklistItem(Base, TimestampMixin):
    __tablename__ = "production_order_checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    done_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    done_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)

    production_order: Mapped[ProductionOrder] = relationship(back_populates="checklist_items")

    __table_args__ = (
        Index("ix_production_order_checklist_items_order_id", "production_order_id"),
        Index("ix_production_order_checklist_items_order_index", "order_index"),
        Index("ix_production_order_checklist_items_is_done", "is_done"),
    )


class ProductionOrderActivityLog(Base):
    __tablename__ = "production_order_activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=True, index=True)
    card_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kanban_cards.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    old_value_json: Mapped[dict | None] = mapped_column("old_value", JSONB, nullable=True)
    new_value_json: Mapped[dict | None] = mapped_column("new_value", JSONB, nullable=True)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    production_order: Mapped[ProductionOrder | None] = relationship(back_populates="activity_logs")
