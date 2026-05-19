"""Pydantic schemas for Kanban Producao."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ProductionPriority = Literal["baixa", "normal", "alta", "urgente"]
ProductionStatus = Literal["aberta", "em_andamento", "aguardando", "pronta", "arquivada"]
TemplateType = Literal["producao", "projeto", "custom"]


class ProductionOrderCreate(BaseModel):
    numero_op: str = Field(..., min_length=1, max_length=80)
    cliente: str | None = Field(None, max_length=200)
    projeto: str | None = Field(None, max_length=200)
    modelo: str | None = Field(None, max_length=160)
    quantidade: int | None = Field(None, ge=0)
    setor: str | None = Field(None, max_length=120)
    data_inicio: date | None = None
    data_entrega: date | None = None
    prioridade: ProductionPriority = "normal"
    status: ProductionStatus = "aberta"
    observacoes: str | None = None
    checklist_template_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductionOrderUpdate(BaseModel):
    numero_op: str | None = Field(None, min_length=1, max_length=80)
    cliente: str | None = Field(None, max_length=200)
    projeto: str | None = Field(None, max_length=200)
    modelo: str | None = Field(None, max_length=160)
    quantidade: int | None = Field(None, ge=0)
    setor: str | None = Field(None, max_length=120)
    data_inicio: date | None = None
    data_entrega: date | None = None
    prioridade: ProductionPriority | None = None
    status: ProductionStatus | None = None
    observacoes: str | None = None
    metadata: dict[str, Any] | None = None


class ProductionOrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    card_id: UUID
    board_id: UUID
    numero_op: str
    cliente: str | None
    projeto: str | None
    modelo: str | None
    quantidade: int | None
    setor: str | None
    data_inicio: date | None
    data_entrega: date | None
    prioridade: str
    status: str
    percentual_checklist: Decimal
    is_archived: bool
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")


class ProductionOrderRead(ProductionOrderListItem):
    observacoes: str | None
    created_by: UUID | None
    updated_by: UUID | None
    archived_at: datetime | None


class ProductionChecklistTemplateItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    order_index: int = Field(..., ge=0)
    is_required: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductionChecklistTemplateItemUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    order_index: int | None = Field(None, ge=0)
    is_required: bool | None = None
    metadata: dict[str, Any] | None = None


class ProductionChecklistTemplateItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    template_id: UUID
    title: str
    description: str | None
    order_index: int
    is_required: bool
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")


class ProductionChecklistTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    template_type: TemplateType = "producao"
    is_default: bool = False
    is_active: bool = True
    items: list[ProductionChecklistTemplateItemCreate] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductionChecklistTemplateUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    template_type: TemplateType | None = None
    is_default: bool | None = None
    is_active: bool | None = None
    metadata: dict[str, Any] | None = None


class ProductionChecklistTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    template_type: str
    is_default: bool
    is_active: bool
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")
    items: list[ProductionChecklistTemplateItemRead] = Field(default_factory=list)


class ProductionOrderChecklistItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None
    order_index: int | None = Field(None, ge=0)
    is_required: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProductionOrderChecklistItemUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None
    order_index: int | None = Field(None, ge=0)
    is_required: bool | None = None
    is_done: bool | None = None
    metadata: dict[str, Any] | None = None


class ProductionOrderChecklistItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    production_order_id: UUID
    title: str
    description: str | None
    order_index: int
    is_required: bool
    is_done: bool
    done_by: UUID | None
    done_at: datetime | None
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")


class ProductionOrderChecklistReorderRequest(BaseModel):
    items: list[dict[str, UUID | int]]


class ProductionOrderDetailRead(ProductionOrderRead):
    checklist_items: list[ProductionOrderChecklistItemRead] = Field(default_factory=list)


class ProductionDashboardRead(BaseModel):
    total_ops: int
    abertas: int
    em_andamento: int
    aguardando: int
    prontas: int
    arquivadas: int
    percentual_medio_checklist: Decimal


class ProductionTVItemRead(BaseModel):
    numero_op: str
    cliente: str | None
    projeto: str | None
    modelo: str | None
    status: str
    prioridade: str
    percentual_checklist: Decimal
    data_entrega: date | None
    card_id: UUID
    column_id: UUID


class ProductionTVResponse(BaseModel):
    mode: Literal["list", "kanban"]
    items: list[ProductionTVItemRead] | dict[str, list[ProductionTVItemRead]]


class ProductionActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    production_order_id: UUID | None
    card_id: UUID | None
    user_id: UUID | None
    action: str
    old_value: dict[str, Any] | None = Field(default=None, validation_alias="old_value_json", serialization_alias="old_value")
    new_value: dict[str, Any] | None = Field(default=None, validation_alias="new_value_json", serialization_alias="new_value")
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime
