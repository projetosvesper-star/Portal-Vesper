"""Configuracao versionada do Kanban Engine armazenada em JSONB."""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from pydantic import ValidationError

from app.modules.kanban.schemas import (
    KanbanBoardConfigRead,
    KanbanBoardConfigUpdate,
    MAX_CUSTOM_FIELDS_BYTES,
    _json_size,
)

CONFIG_METADATA_KEY = "config"
CUSTOM_FIELDS_METADATA_KEY = "customFields"
INTERNAL_CARD_METADATA_KEYS = {"production_order_id", "production_type", "percentual_checklist", "created_from"}


def default_board_config() -> KanbanBoardConfigRead:
    return KanbanBoardConfigRead()


def normalize_board_config(metadata: dict | None) -> KanbanBoardConfigRead:
    raw_config = (metadata or {}).get(CONFIG_METADATA_KEY)
    if not raw_config:
        return default_board_config()
    try:
        return KanbanBoardConfigRead.model_validate(raw_config)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=_validation_detail(exc))


def merge_board_config(metadata: dict | None, patch: KanbanBoardConfigUpdate) -> tuple[dict, KanbanBoardConfigRead, KanbanBoardConfigRead]:
    current_metadata = dict(metadata or {})
    old_config = normalize_board_config(current_metadata)
    current_config_dict = old_config.model_dump(mode="json")
    patch_dict = patch.model_dump(exclude_unset=True, mode="json")
    patch_dict.pop("configVersion", None)

    merged = _deep_merge(current_config_dict, patch_dict)
    merged["configVersion"] = 1
    new_config = KanbanBoardConfigRead.model_validate(merged)
    current_metadata[CONFIG_METADATA_KEY] = new_config.model_dump(mode="json")
    return current_metadata, old_config, new_config


def validate_config_payload(config: KanbanBoardConfigRead) -> KanbanBoardConfigRead:
    return KanbanBoardConfigRead.model_validate(config.model_dump(mode="json"))


def validate_card_metadata_for_board(config: KanbanBoardConfigRead, metadata: dict | None) -> dict:
    current_metadata = dict(metadata or {})
    custom_fields = current_metadata.get(CUSTOM_FIELDS_METADATA_KEY, {})
    if custom_fields is None:
        custom_fields = {}
    if not isinstance(custom_fields, dict):
        raise HTTPException(status_code=422, detail="metadata.customFields deve ser um objeto")
    if _json_size(custom_fields) > MAX_CUSTOM_FIELDS_BYTES:
        raise HTTPException(status_code=422, detail=f"metadata.customFields excede limite de {MAX_CUSTOM_FIELDS_BYTES} bytes")

    definitions = sorted(config.card.fields, key=lambda item: item.order)
    definitions_by_key = {definition.key: definition for definition in definitions}
    unknown = sorted(set(custom_fields.keys()) - set(definitions_by_key.keys()))
    if unknown:
        raise HTTPException(status_code=422, detail=f"Campos customizados desconhecidos: {', '.join(unknown)}")

    normalized: dict[str, Any] = {}
    for definition in definitions:
        present = definition.key in custom_fields
        value = custom_fields.get(definition.key)
        if definition.required and _is_empty(value):
            raise HTTPException(status_code=422, detail=f"Campo customizado obrigatorio ausente: {definition.label}")
        if not present or _is_empty(value):
            continue
        normalized[definition.key] = _validate_custom_value(definition.key, definition.label, definition.type, value, definition.options)

    current_metadata[CUSTOM_FIELDS_METADATA_KEY] = normalized
    return current_metadata


def _validate_custom_value(key: str, label: str, field_type: str, value: Any, options: list | None) -> Any:
    if field_type == "text":
        if not isinstance(value, str) or len(value) > 300:
            raise HTTPException(status_code=422, detail=f"{label} deve ser um texto curto")
        return value
    if field_type == "textarea":
        if not isinstance(value, str) or len(value) > 5000:
            raise HTTPException(status_code=422, detail=f"{label} deve ser um texto")
        return value
    if field_type == "number":
        if isinstance(value, bool) or not isinstance(value, int | float):
            raise HTTPException(status_code=422, detail=f"{label} deve ser um numero")
        return value
    if field_type == "currency":
        if isinstance(value, bool) or not isinstance(value, int):
            raise HTTPException(status_code=422, detail=f"{label} deve ser um inteiro em centavos")
        return value
    if field_type == "date":
        if not isinstance(value, str):
            raise HTTPException(status_code=422, detail=f"{label} deve ser uma data")
        try:
            date.fromisoformat(value[:10])
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"{label} deve usar formato de data valido") from exc
        return value[:10]
    if field_type == "select":
        allowed = {option.value for option in options or []}
        if not isinstance(value, str) or value not in allowed:
            raise HTTPException(status_code=422, detail=f"{label} deve ter uma opcao valida")
        return value
    if field_type == "checkbox":
        if not isinstance(value, bool):
            raise HTTPException(status_code=422, detail=f"{label} deve ser verdadeiro ou falso")
        return value
    if field_type == "user":
        try:
            return str(UUID(str(value)))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail=f"{label} deve ser um user_id valido") from exc
    raise HTTPException(status_code=422, detail=f"Tipo de campo nao suportado para {key}")


def _is_empty(value: Any) -> bool:
    return value is None or value == ""


def _deep_merge(base: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    result = dict(base)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def _validation_detail(exc: ValidationError) -> str:
    messages = []
    for error in exc.errors():
        loc = ".".join(str(part) for part in error.get("loc", []))
        msg = error.get("msg", "valor invalido")
        messages.append(f"{loc}: {msg}" if loc else msg)
    return "; ".join(messages) or "Configuracao invalida"
