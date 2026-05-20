"""Pydantic schemas for Kanban Engine."""

from __future__ import annotations

from datetime import datetime
import json
import re
from typing import Any, Literal
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator


MAX_CONFIG_FIELDS = 40
MAX_CONFIG_BYTES = 32_000
MAX_CUSTOM_FIELDS_BYTES = 64_000
FIELD_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9_]{0,63}$")
CUSTOM_FIELD_TYPES = ("text", "textarea", "number", "date", "select", "checkbox", "user", "currency")


def _json_size(value: Any) -> int:
    return len(json.dumps(value, ensure_ascii=False, default=str).encode("utf-8"))


class KanbanFieldOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str = Field(..., min_length=1, max_length=120)
    label: str = Field(..., min_length=1, max_length=160)


class KanbanCustomFieldDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(..., min_length=1, max_length=64)
    label: str = Field(..., min_length=1, max_length=160)
    type: Literal["text", "textarea", "number", "date", "select", "checkbox", "user", "currency"]
    required: bool = False
    showInCard: bool = False
    showInDrawer: bool = True
    showInTv: bool = False
    showInFilters: bool = False
    order: int = Field(default=0, ge=0, le=10_000)
    options: list[KanbanFieldOption] | None = None

    @field_validator("key")
    @classmethod
    def validate_key(cls, value: str) -> str:
        if not FIELD_KEY_PATTERN.fullmatch(value):
            raise ValueError("key deve usar letras minusculas, numeros e underline, sem espacos ou acentos")
        return value

    @model_validator(mode="after")
    def validate_options(self) -> "KanbanCustomFieldDefinition":
        if self.type == "select" and not self.options:
            raise ValueError("Campos select exigem options")
        if self.type != "select" and self.options:
            raise ValueError("options so e permitido para campos select")
        if self.options:
            values = [option.value for option in self.options]
            if len(values) != len(set(values)):
                raise ValueError("Options do select devem ter values unicos")
        return self


class KanbanTerminologyConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    itemSingular: str = Field(default="Card", min_length=1, max_length=80)
    itemPlural: str = Field(default="Cards", min_length=1, max_length=80)
    newItemLabel: str = Field(default="Novo card", min_length=1, max_length=120)
    editItemLabel: str = Field(default="Editar card", min_length=1, max_length=120)
    itemTitleLabel: str = Field(default="Titulo", min_length=1, max_length=120)
    itemDescriptionLabel: str = Field(default="Descricao", min_length=1, max_length=120)
    emptyStateText: str = Field(default="Nenhum card encontrado", min_length=1, max_length=220)


class KanbanVisualConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    accentColor: str = Field(default="#38d3ee", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(default="KanbanSquare", min_length=1, max_length=80)
    cardDensity: Literal["compact", "comfortable"] = "comfortable"


class KanbanFeaturesConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    checklist: bool = True
    comments: bool = True
    attachments: bool = True
    activity: bool = True


class KanbanCardConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fields: list[KanbanCustomFieldDefinition] = Field(default_factory=list, max_length=MAX_CONFIG_FIELDS)

    @model_validator(mode="after")
    def validate_unique_fields(self) -> "KanbanCardConfig":
        keys = [field.key for field in self.fields]
        if len(keys) != len(set(keys)):
            raise ValueError("As keys dos campos customizados devem ser unicas")
        return self


class KanbanTvConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enabled: bool = True
    defaultMode: Literal["list", "kanban"] = "kanban"
    titleField: str = Field(default="title", min_length=1, max_length=80)
    subtitleFields: list[str] = Field(default_factory=list, max_length=8)
    showPriority: bool = True
    showAssignee: bool = True
    showDueDate: bool = True
    showChecklist: bool = True
    showTags: bool = True
    textSize: Literal["normal", "large", "xlarge"] = "large"


class KanbanBoardConfigRead(BaseModel):
    model_config = ConfigDict(extra="forbid")

    configVersion: Literal[1] = 1
    terminology: KanbanTerminologyConfig = Field(default_factory=KanbanTerminologyConfig)
    visual: KanbanVisualConfig = Field(default_factory=KanbanVisualConfig)
    features: KanbanFeaturesConfig = Field(default_factory=KanbanFeaturesConfig)
    card: KanbanCardConfig = Field(default_factory=KanbanCardConfig)
    tv: KanbanTvConfig = Field(default_factory=KanbanTvConfig)

    @model_validator(mode="after")
    def validate_size(self) -> "KanbanBoardConfigRead":
        if _json_size(self.model_dump(mode="json")) > MAX_CONFIG_BYTES:
            raise ValueError(f"Configuracao excede limite de {MAX_CONFIG_BYTES} bytes")
        return self


class KanbanBoardConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    configVersion: Literal[1] | None = None
    terminology: KanbanTerminologyConfig | None = None
    visual: KanbanVisualConfig | None = None
    features: KanbanFeaturesConfig | None = None
    card: KanbanCardConfig | None = None
    tv: KanbanTvConfig | None = None

    @model_validator(mode="after")
    def validate_patch_size(self) -> "KanbanBoardConfigUpdate":
        if _json_size(self.model_dump(exclude_unset=True, mode="json")) > MAX_CONFIG_BYTES:
            raise ValueError(f"Patch de configuracao excede limite de {MAX_CONFIG_BYTES} bytes")
        return self


class KanbanBoardConfigValidateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    config: KanbanBoardConfigRead


class KanbanBoardConfigEnvelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    board_id: UUID
    config: KanbanBoardConfigRead
    metadata: dict[str, Any] = Field(default_factory=dict)


class KanbanCardCustomFieldsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customFields: dict[str, Any] = Field(default_factory=dict)


class KanbanHubContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    kind: Literal["generic", "specialized", "system"] = "generic"
    boardType: str | None = Field(default=None, max_length=50)
    moduleContext: str | None = Field(default=None, max_length=80)
    route: str | None = Field(default=None, max_length=160)
    icon: str = Field(default="KanbanSquare", min_length=1, max_length=80)
    order: int = Field(default=0, ge=0, le=10_000)
    visible: bool = True
    isSystem: bool = False
    requiredPermission: str | None = Field(default="kanban.board.view", max_length=120)
    deletedAt: datetime | None = None

    @field_validator("key")
    @classmethod
    def validate_context_key(cls, value: str) -> str:
        if not FIELD_KEY_PATTERN.fullmatch(value):
            raise ValueError("key deve usar letras minusculas, numeros e underline")
        return value


class KanbanHubContextCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    kind: Literal["generic", "specialized", "system"] = "generic"
    boardType: str | None = Field(default=None, max_length=50)
    moduleContext: str | None = Field(default=None, max_length=80)
    route: str | None = Field(default=None, max_length=160)
    icon: str = Field(default="KanbanSquare", min_length=1, max_length=80)
    order: int = Field(default=0, ge=0, le=10_000)
    visible: bool = True
    requiredPermission: str | None = Field(default="kanban.board.view", max_length=120)

    @field_validator("key")
    @classmethod
    def validate_context_key(cls, value: str) -> str:
        if not FIELD_KEY_PATTERN.fullmatch(value):
            raise ValueError("key deve usar letras minusculas, numeros e underline")
        return value


class KanbanHubContextUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=260)
    kind: Literal["generic", "specialized", "system"] | None = None
    boardType: str | None = Field(default=None, max_length=50)
    moduleContext: str | None = Field(default=None, max_length=80)
    route: str | None = Field(default=None, max_length=160)
    icon: str | None = Field(default=None, min_length=1, max_length=80)
    order: int | None = Field(default=None, ge=0, le=10_000)
    visible: bool | None = None
    requiredPermission: str | None = Field(default=None, max_length=120)


class KanbanHubContextOrderItem(BaseModel):
    key: str
    order: int = Field(..., ge=0, le=10_000)


class KanbanHubContextReorderRequest(BaseModel):
    contexts: list[KanbanHubContextOrderItem]


class KanbanTemplateColumn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=120)
    key: str | None = Field(default=None, max_length=80)
    order: int = Field(..., ge=0, le=10_000)
    isDone: bool = False

    @field_validator("key")
    @classmethod
    def validate_optional_key(cls, value: str | None) -> str | None:
        if value is not None and not FIELD_KEY_PATTERN.fullmatch(value):
            raise ValueError("key da coluna deve usar letras minusculas, numeros e underline")
        return value


class KanbanBoardTemplate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=300)
    boardType: str = Field(default="custom", pattern="^(production|projects|operational|helpdesk|custom)$")
    moduleContext: str | None = Field(default=None, max_length=80)
    icon: str = Field(default="KanbanSquare", min_length=1, max_length=80)
    color: str = Field(default="#38d3ee", pattern=r"^#[0-9a-fA-F]{6}$")
    isSystem: bool = False
    isActive: bool = True
    order: int = Field(default=0, ge=0, le=10_000)
    columns: list[KanbanTemplateColumn] = Field(..., min_length=1, max_length=30)
    config: KanbanBoardConfigRead = Field(default_factory=KanbanBoardConfigRead)
    deletedAt: datetime | None = None

    @field_validator("key")
    @classmethod
    def validate_template_key(cls, value: str) -> str:
        if not FIELD_KEY_PATTERN.fullmatch(value):
            raise ValueError("key deve usar letras minusculas, numeros e underline")
        return value

    @model_validator(mode="after")
    def validate_template_columns(self) -> "KanbanBoardTemplate":
        keys = [column.key for column in self.columns if column.key]
        if len(keys) != len(set(keys)):
            raise ValueError("keys das colunas do template devem ser unicas")
        return self


class KanbanBoardTemplateCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=300)
    boardType: str = Field(default="custom", pattern="^(production|projects|operational|helpdesk|custom)$")
    moduleContext: str | None = Field(default=None, max_length=80)
    icon: str = Field(default="KanbanSquare", min_length=1, max_length=80)
    color: str = Field(default="#38d3ee", pattern=r"^#[0-9a-fA-F]{6}$")
    order: int = Field(default=0, ge=0, le=10_000)
    columns: list[KanbanTemplateColumn] = Field(..., min_length=1, max_length=30)
    config: KanbanBoardConfigRead = Field(default_factory=KanbanBoardConfigRead)

    @field_validator("key")
    @classmethod
    def validate_template_key(cls, value: str) -> str:
        if not FIELD_KEY_PATTERN.fullmatch(value):
            raise ValueError("key deve usar letras minusculas, numeros e underline")
        return value


class KanbanBoardTemplateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=300)
    boardType: str | None = Field(default=None, pattern="^(production|projects|operational|helpdesk|custom)$")
    moduleContext: str | None = Field(default=None, max_length=80)
    icon: str | None = Field(default=None, min_length=1, max_length=80)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    isActive: bool | None = None
    order: int | None = Field(default=None, ge=0, le=10_000)
    columns: list[KanbanTemplateColumn] | None = Field(default=None, min_length=1, max_length=30)
    config: KanbanBoardConfigRead | None = None


class KanbanBoardTemplateDuplicateRequest(BaseModel):
    key: str | None = Field(default=None, max_length=80)
    name: str | None = Field(default=None, max_length=140)


class KanbanBoardFromTemplateCreate(BaseModel):
    templateKey: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    contextKey: str | None = Field(default=None, max_length=80)


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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

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
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")


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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

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
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")


class ColumnOrderItem(BaseModel):
    column_id: UUID
    order_index: int = Field(..., ge=0)


class ColumnReorderRequest(BaseModel):
    columns: list[ColumnOrderItem]


class CardTypeCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    board_id: UUID | None = None
    key: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    color: str | None = Field(None, max_length=20)
    icon: str | None = Field(None, max_length=50)
    field_schema: dict[str, Any] = Field(default_factory=dict, validation_alias=AliasChoices("field_schema", "schema"))


class CardTypeUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    color: str | None = Field(None, max_length=20)
    icon: str | None = Field(None, max_length=50)
    field_schema: dict[str, Any] = Field(default=None, validation_alias=AliasChoices("field_schema", "schema"))
    is_active: bool | None = None


class CardTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    board_id: UUID | None
    key: str
    name: str
    description: str | None
    color: str | None
    icon: str | None
    field_schema: dict[str, Any] = Field(default_factory=dict, validation_alias="schema_json", serialization_alias="field_schema")
    is_active: bool
    created_at: datetime
    updated_at: datetime


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
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

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
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")


class CardMoveRequest(BaseModel):
    to_column_id: UUID
    new_order_index: int = Field(..., ge=0)


class CardAssigneeCreate(BaseModel):
    user_id: UUID
    role: str | None = Field(None, max_length=50)


class CardAssigneeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    card_id: UUID
    user_id: UUID
    role: str | None
    created_at: datetime


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
    model_config = ConfigDict(from_attributes=True)

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


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    card_id: UUID
    user_id: UUID
    content: str
    edited_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AttachmentCreate(BaseModel):
    file_id: UUID


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    card_id: UUID
    file_id: UUID
    uploaded_by: UUID | None
    created_at: datetime


class ActivityLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    board_id: UUID | None
    card_id: UUID | None
    user_id: UUID | None
    action: str
    old_value: dict[str, Any] | None = Field(default=None, validation_alias="old_value_json", serialization_alias="old_value")
    new_value: dict[str, Any] | None = Field(default=None, validation_alias="new_value_json", serialization_alias="new_value")
    metadata: dict[str, Any] = Field(default_factory=dict, validation_alias="metadata_json", serialization_alias="metadata")
    created_at: datetime


class BoardPermissionCreate(BaseModel):
    user_id: UUID | None = None
    role_id: UUID | None = None
    permission_key: str = Field(..., min_length=1, max_length=120)


class BoardPermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    board_id: UUID
    user_id: UUID | None
    role_id: UUID | None
    permission_key: str
    created_at: datetime
