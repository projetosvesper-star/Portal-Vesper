"""Service do Kanban Engine (regras de dominio, auditoria e eventos)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.models import User
from app.modules.kanban import events
from app.modules.kanban.configuration import merge_board_config, normalize_board_config, validate_card_metadata_for_board, validate_config_payload
from app.modules.kanban.hub_config import (
    HUB_CONFIG_BOARD_KEY,
    HUB_CONFIG_METADATA_KEY,
    default_hub_contexts,
    default_board_templates,
    normalize_contexts,
    normalize_templates,
    serialize_hub_config,
)
from app.modules.kanban.models import (
    KanbanActivityLog,
    KanbanAttachment,
    KanbanBoard,
    KanbanBoardPermission,
    KanbanCard,
    KanbanCardAssignee,
    KanbanChecklistItem,
    KanbanColumn,
    KanbanComment,
)
from app.modules.kanban.repository import KanbanRepository
from app.modules.kanban.schemas import KanbanBoardConfigRead, KanbanBoardConfigUpdate
from app.modules.kanban.schemas import (
    KanbanBoardFromTemplateCreate,
    KanbanBoardTemplate,
    KanbanBoardTemplateCreate,
    KanbanBoardTemplateDuplicateRequest,
    KanbanBoardTemplateUpdate,
    KanbanHubContext,
    KanbanHubContextCreate,
    KanbanHubContextReorderRequest,
    KanbanHubContextUpdate,
)


class KanbanService:
    def __init__(self, session: AsyncSession, repo: KanbanRepository | None = None) -> None:
        self.session = session
        self.repo = repo or KanbanRepository(session)

    # -----------------------------
    # Helpers
    # -----------------------------
    async def _activity(
        self,
        action: str,
        *,
        board_id: UUID | None = None,
        card_id: UUID | None = None,
        actor_user_id: UUID | None = None,
        old_value: dict | None = None,
        new_value: dict | None = None,
        metadata: dict | None = None,
    ) -> KanbanActivityLog:
        log = KanbanActivityLog(
            board_id=board_id,
            card_id=card_id,
            user_id=actor_user_id,
            action=action,
            old_value_json=old_value,
            new_value_json=new_value,
            metadata_json=metadata or {},
        )
        return await self.repo.create_activity_log(log)

    async def _audit(
        self,
        action: str,
        *,
        actor_user_id: UUID | None,
        entity_type: str,
        entity_id: UUID | None,
        metadata: dict | None = None,
    ) -> None:
        await write_audit_log(
            self.session,
            action,
            user_id=actor_user_id,
            module_key="kanban",
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata,
        )

    async def _emit(self, event_type: str, payload: dict, *, publish_to_user_id: UUID | None = None) -> None:
        await events.publish_kanban_event(
            event_type,
            payload,
            publish_to_user_id=str(publish_to_user_id) if publish_to_user_id else None,
        )

    # -----------------------------
    # Boards
    # -----------------------------
    async def list_boards(
        self,
        *,
        board_type: str | None = None,
        module_context: str | None = None,
        include_archived: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[KanbanBoard]:
        boards = await self.repo.list_boards(
            board_type=board_type,
            module_context=module_context,
            is_archived=None if include_archived else False,
            limit=limit,
            offset=offset,
        )
        return [board for board in boards if board.key != HUB_CONFIG_BOARD_KEY]

    async def get_board(self, board_id: UUID) -> KanbanBoard:
        board = await self.repo.get_board(board_id)
        if board is None:
            raise HTTPException(status_code=404, detail="Quadro nao encontrado")
        return board

    async def create_board(self, payload: dict, actor: User) -> KanbanBoard:
        board = KanbanBoard(
            key=payload.get("key"),
            name=payload["name"],
            description=payload.get("description"),
            board_type=payload["board_type"],
            module_context=payload.get("module_context"),
            color=payload.get("color"),
            icon=payload.get("icon"),
            is_active=True,
            is_archived=False,
            created_by=actor.id,
            metadata_json=payload.get("metadata") or {},
        )
        await self.repo.create_board(board)

        await self._activity(
            "board.created",
            board_id=board.id,
            actor_user_id=actor.id,
            new_value={"name": board.name, "board_type": board.board_type, "key": board.key},
        )
        await self._audit("board.created", actor_user_id=actor.id, entity_type="kanban_boards", entity_id=board.id)
        await self._emit(
            events.KANBAN_BOARD_CREATED,
            {
                "board_id": str(board.id),
                "board_key": board.key,
                "board_name": board.name,
                "board_type": board.board_type,
                "actor_user_id": str(actor.id),
            },
            publish_to_user_id=actor.id,
        )
        return board

    async def update_board(self, board_id: UUID, payload: dict, actor: User) -> KanbanBoard:
        board = await self.get_board(board_id)
        old = {"name": board.name, "description": board.description, "color": board.color, "icon": board.icon}

        for field in ("name", "description", "color", "icon", "is_active"):
            if field in payload and payload[field] is not None:
                setattr(board, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            board.metadata_json = payload["metadata"]

        await self.repo.update_board(board)
        await self._activity(
            "board.updated",
            board_id=board.id,
            actor_user_id=actor.id,
            old_value=old,
            new_value=payload,
        )
        await self._audit("board.updated", actor_user_id=actor.id, entity_type="kanban_boards", entity_id=board.id, metadata=payload)
        await self._emit(
            events.KANBAN_BOARD_UPDATED,
            {"board_id": str(board.id), "board_name": board.name, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return board

    async def get_board_config(self, board_id: UUID) -> KanbanBoardConfigRead:
        board = await self.get_board(board_id)
        return normalize_board_config(board.metadata_json)

    async def validate_board_config(self, config: KanbanBoardConfigRead) -> KanbanBoardConfigRead:
        return validate_config_payload(config)

    async def update_board_config(self, board_id: UUID, patch: KanbanBoardConfigUpdate, actor: User) -> KanbanBoard:
        board = await self.get_board(board_id)
        if isinstance(patch, dict):
            patch = KanbanBoardConfigUpdate.model_validate(patch)
        merged_metadata, old_config, new_config = merge_board_config(board.metadata_json, patch)
        board.metadata_json = merged_metadata
        await self.repo.update_board(board)

        payload = {
            "board_id": str(board.id),
            "actor_user_id": str(actor.id),
            "configVersion": new_config.configVersion,
        }
        await self._activity(
            "board.config.updated",
            board_id=board.id,
            actor_user_id=actor.id,
            old_value=old_config.model_dump(mode="json"),
            new_value=new_config.model_dump(mode="json"),
            metadata={"configVersion": new_config.configVersion},
        )
        await self._audit(
            "board.config.updated",
            actor_user_id=actor.id,
            entity_type="kanban_boards",
            entity_id=board.id,
            metadata=payload,
        )
        await self._emit(events.KANBAN_BOARD_CONFIG_UPDATED, payload, publish_to_user_id=actor.id)
        return board

    # -----------------------------
    # Hub config: contexts/templates
    # -----------------------------
    async def _hub_config_board(self) -> KanbanBoard:
        board = await self.repo.get_board_by_key(HUB_CONFIG_BOARD_KEY)
        if board is None:
            board = KanbanBoard(
                key=HUB_CONFIG_BOARD_KEY,
                name="Kanban Hub Config",
                description="Configuracao persistente do Hub Kanban.",
                board_type="system",
                module_context="kanban",
                icon="Settings",
                is_active=False,
                is_archived=True,
                metadata_json={
                    HUB_CONFIG_METADATA_KEY: serialize_hub_config(default_hub_contexts(), default_board_templates()),
                    "system": True,
                },
            )
            try:
                await self.repo.create_board(board)
                return board
            except IntegrityError:
                await self.repo.session.rollback()
                existing = await self.repo.get_board_by_key(HUB_CONFIG_BOARD_KEY)
                if existing is not None:
                    return existing
                raise

        metadata = dict(board.metadata_json or {})
        hub = metadata.get(HUB_CONFIG_METADATA_KEY) if isinstance(metadata.get(HUB_CONFIG_METADATA_KEY), dict) else {}
        contexts = normalize_contexts(hub.get("contexts"))
        templates = normalize_templates(hub.get("templates"))
        metadata[HUB_CONFIG_METADATA_KEY] = serialize_hub_config(contexts, templates)
        metadata["system"] = True
        board.metadata_json = metadata
        await self.repo.update_board(board)
        return board

    async def _read_hub_config(self) -> tuple[KanbanBoard, list[KanbanHubContext], list[KanbanBoardTemplate]]:
        board = await self._hub_config_board()
        hub = (board.metadata_json or {}).get(HUB_CONFIG_METADATA_KEY) or {}
        return board, normalize_contexts(hub.get("contexts")), normalize_templates(hub.get("templates"))

    async def _write_hub_config(
        self,
        board: KanbanBoard,
        contexts: list[KanbanHubContext],
        templates: list[KanbanBoardTemplate],
    ) -> None:
        metadata = dict(board.metadata_json or {})
        metadata[HUB_CONFIG_METADATA_KEY] = serialize_hub_config(contexts, templates)
        metadata["system"] = True
        board.metadata_json = metadata
        await self.repo.update_board(board)

    async def list_contexts(self) -> list[KanbanHubContext]:
        _, contexts, _ = await self._read_hub_config()
        return [context for context in contexts if context.deletedAt is None]

    async def create_context(self, payload: KanbanHubContextCreate, actor: User) -> KanbanHubContext:
        board, contexts, templates = await self._read_hub_config()
        if any(context.key == payload.key and context.deletedAt is None for context in contexts):
            raise HTTPException(status_code=409, detail="Contexto ja existe")
        if payload.route and any(context.route == payload.route and context.deletedAt is None for context in contexts):
            raise HTTPException(status_code=409, detail="Ja existe contexto ativo com esta route")
        context = KanbanHubContext.model_validate({**payload.model_dump(), "isSystem": False})
        contexts.append(context)
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.context.created", actor_user_id=actor.id, entity_type="kanban_contexts", entity_id=None, metadata=context.model_dump(mode="json"))
        await self._emit(events.KANBAN_CONTEXT_CREATED, {"context_key": context.key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return context

    async def update_context(self, context_key: str, payload: KanbanHubContextUpdate, actor: User) -> KanbanHubContext:
        board, contexts, templates = await self._read_hub_config()
        index = next((idx for idx, item in enumerate(contexts) if item.key == context_key and item.deletedAt is None), None)
        if index is None:
            raise HTTPException(status_code=404, detail="Contexto nao encontrado")
        current = contexts[index]
        data = current.model_dump()
        patch = payload.model_dump(exclude_unset=True)
        if current.isSystem:
            patch.pop("kind", None)
        data.update(patch)
        updated = KanbanHubContext.model_validate(data)
        if updated.route and any(item.key != updated.key and item.route == updated.route and item.deletedAt is None for item in contexts):
            raise HTTPException(status_code=409, detail="Ja existe contexto ativo com esta route")
        contexts[index] = updated
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.context.updated", actor_user_id=actor.id, entity_type="kanban_contexts", entity_id=None, metadata={"context_key": context_key})
        await self._emit(events.KANBAN_CONTEXT_UPDATED, {"context_key": context_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return updated

    async def delete_context(self, context_key: str, actor: User) -> KanbanHubContext:
        board, contexts, templates = await self._read_hub_config()
        index = next((idx for idx, item in enumerate(contexts) if item.key == context_key and item.deletedAt is None), None)
        if index is None:
            raise HTTPException(status_code=404, detail="Contexto nao encontrado")
        current = contexts[index]
        if current.isSystem:
            updated = KanbanHubContext.model_validate({**current.model_dump(), "visible": False})
        else:
            updated = KanbanHubContext.model_validate({**current.model_dump(), "visible": False, "deletedAt": datetime.now(UTC)})
        contexts[index] = updated
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.context.deleted", actor_user_id=actor.id, entity_type="kanban_contexts", entity_id=None, metadata={"context_key": context_key})
        await self._emit(events.KANBAN_CONTEXT_DELETED, {"context_key": context_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return updated

    async def restore_default_contexts(self, actor: User) -> list[KanbanHubContext]:
        board, contexts, templates = await self._read_hub_config()
        custom = [context for context in contexts if not context.isSystem]
        contexts = default_hub_contexts() + custom
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.context.defaults_restored", actor_user_id=actor.id, entity_type="kanban_contexts", entity_id=None)
        await self._emit(events.KANBAN_CONTEXT_DEFAULTS_RESTORED, {"actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return [context for context in contexts if context.deletedAt is None]

    async def reorder_contexts(self, payload: KanbanHubContextReorderRequest, actor: User) -> list[KanbanHubContext]:
        board, contexts, templates = await self._read_hub_config()
        order_by_key = {item.key: item.order for item in payload.contexts}
        updated = [KanbanHubContext.model_validate({**context.model_dump(), "order": order_by_key.get(context.key, context.order)}) for context in contexts]
        await self._write_hub_config(board, updated, templates)
        await self._audit("kanban.context.reordered", actor_user_id=actor.id, entity_type="kanban_contexts", entity_id=None, metadata={"orders": order_by_key})
        await self._emit(events.KANBAN_CONTEXT_REORDERED, {"orders": order_by_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return [context for context in updated if context.deletedAt is None]

    async def list_templates(self) -> list[KanbanBoardTemplate]:
        _, _, templates = await self._read_hub_config()
        return [template for template in templates if template.deletedAt is None]

    async def get_template(self, template_key: str) -> KanbanBoardTemplate:
        templates = await self.list_templates()
        template = next((item for item in templates if item.key == template_key), None)
        if template is None:
            raise HTTPException(status_code=404, detail="Template nao encontrado")
        return template

    async def create_template(self, payload: KanbanBoardTemplateCreate, actor: User) -> KanbanBoardTemplate:
        board, contexts, templates = await self._read_hub_config()
        if any(template.key == payload.key and template.deletedAt is None for template in templates):
            raise HTTPException(status_code=409, detail="Template ja existe")
        template = KanbanBoardTemplate.model_validate({**payload.model_dump(mode="json"), "isSystem": False, "isActive": True})
        templates.append(template)
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.template.created", actor_user_id=actor.id, entity_type="kanban_templates", entity_id=None, metadata=template.model_dump(mode="json"))
        await self._emit(events.KANBAN_TEMPLATE_CREATED, {"template_key": template.key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return template

    async def update_template(self, template_key: str, payload: KanbanBoardTemplateUpdate, actor: User) -> KanbanBoardTemplate:
        board, contexts, templates = await self._read_hub_config()
        index = next((idx for idx, item in enumerate(templates) if item.key == template_key and item.deletedAt is None), None)
        if index is None:
            raise HTTPException(status_code=404, detail="Template nao encontrado")
        current = templates[index]
        data = current.model_dump(mode="json")
        data.update(payload.model_dump(exclude_unset=True, mode="json"))
        data["isSystem"] = current.isSystem
        updated = KanbanBoardTemplate.model_validate(data)
        templates[index] = updated
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.template.updated", actor_user_id=actor.id, entity_type="kanban_templates", entity_id=None, metadata={"template_key": template_key})
        await self._emit(events.KANBAN_TEMPLATE_UPDATED, {"template_key": template_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return updated

    async def delete_template(self, template_key: str, actor: User) -> KanbanBoardTemplate:
        board, contexts, templates = await self._read_hub_config()
        index = next((idx for idx, item in enumerate(templates) if item.key == template_key and item.deletedAt is None), None)
        if index is None:
            raise HTTPException(status_code=404, detail="Template nao encontrado")
        current = templates[index]
        if current.isSystem:
            updated = KanbanBoardTemplate.model_validate({**current.model_dump(mode="json"), "isActive": False})
        else:
            updated = KanbanBoardTemplate.model_validate({**current.model_dump(mode="json"), "isActive": False, "deletedAt": datetime.now(UTC)})
        templates[index] = updated
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.template.deleted", actor_user_id=actor.id, entity_type="kanban_templates", entity_id=None, metadata={"template_key": template_key})
        await self._emit(events.KANBAN_TEMPLATE_DELETED, {"template_key": template_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return updated

    async def duplicate_template(self, template_key: str, payload: KanbanBoardTemplateDuplicateRequest, actor: User) -> KanbanBoardTemplate:
        source = await self.get_template(template_key)
        board, contexts, templates = await self._read_hub_config()
        duplicate_key = payload.key or f"{source.key}_copia"
        if any(template.key == duplicate_key and template.deletedAt is None for template in templates):
            raise HTTPException(status_code=409, detail="Template duplicado ja existe")
        duplicate = KanbanBoardTemplate.model_validate(
            {
                **source.model_dump(mode="json"),
                "key": duplicate_key,
                "name": payload.name or f"{source.name} copia",
                "isSystem": False,
                "isActive": True,
                "deletedAt": None,
            }
        )
        templates.append(duplicate)
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.template.duplicated", actor_user_id=actor.id, entity_type="kanban_templates", entity_id=None, metadata={"source": template_key, "target": duplicate.key})
        await self._emit(events.KANBAN_TEMPLATE_DUPLICATED, {"template_key": duplicate.key, "source_template_key": template_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return duplicate

    async def restore_template(self, template_key: str, actor: User) -> KanbanBoardTemplate:
        board, contexts, templates = await self._read_hub_config()
        index = next((idx for idx, item in enumerate(templates) if item.key == template_key), None)
        if index is None:
            raise HTTPException(status_code=404, detail="Template nao encontrado")
        current = templates[index]
        restored = KanbanBoardTemplate.model_validate({**current.model_dump(mode="json"), "isActive": True, "deletedAt": None})
        templates[index] = restored
        await self._write_hub_config(board, contexts, templates)
        await self._audit("kanban.template.restored", actor_user_id=actor.id, entity_type="kanban_templates", entity_id=None, metadata={"template_key": template_key})
        await self._emit(events.KANBAN_TEMPLATE_RESTORED, {"template_key": template_key, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return restored

    async def create_board_from_template(self, payload: KanbanBoardFromTemplateCreate, actor: User) -> KanbanBoard:
        template = await self.get_template(payload.templateKey)
        if not template.isActive:
            raise HTTPException(status_code=400, detail="Template inativo")
        contexts = await self.list_contexts()
        context = next((item for item in contexts if item.key == payload.contextKey), None) if payload.contextKey else None
        if payload.contextKey and context is None:
            raise HTTPException(status_code=404, detail="Contexto nao encontrado")

        board = await self.create_board(
            {
                "key": None,
                "name": payload.name,
                "description": payload.description or template.description,
                "board_type": context.boardType if context and context.boardType else template.boardType,
                "module_context": context.moduleContext if context and context.moduleContext else template.moduleContext,
                "color": template.color,
                "icon": template.icon,
                "metadata": {
                    "created_from": "kanban_template",
                    "templateKey": template.key,
                    "contextKey": payload.contextKey,
                    "config": template.config.model_dump(mode="json"),
                },
            },
            actor,
        )
        if not template.columns:
            raise HTTPException(status_code=422, detail="Template precisa ter colunas")
        for index, column in enumerate(sorted(template.columns, key=lambda item: item.order)):
            await self.create_column(
                board.id,
                {
                    "name": column.name,
                    "key": column.key,
                    "order_index": index,
                    "is_done": column.isDone,
                    "metadata": {"created_from": "kanban_template", "templateKey": template.key},
                },
                actor,
            )
        await self._activity(
            "board.created_from_template",
            board_id=board.id,
            actor_user_id=actor.id,
            metadata={"templateKey": template.key, "contextKey": payload.contextKey},
        )
        await self._audit(
            "kanban.board.created_from_template",
            actor_user_id=actor.id,
            entity_type="kanban_boards",
            entity_id=board.id,
            metadata={"templateKey": template.key, "contextKey": payload.contextKey},
        )
        await self._emit(
            events.KANBAN_BOARD_CREATED_FROM_TEMPLATE,
            {"board_id": str(board.id), "template_key": template.key, "context_key": payload.contextKey, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return board

    async def archive_board(self, board_id: UUID, actor: User) -> KanbanBoard:
        board = await self.get_board(board_id)
        if board.is_archived:
            return board
        board.is_archived = True
        board.archived_at = datetime.now(UTC)
        await self.repo.update_board(board)

        await self._activity(
            "board.archived",
            board_id=board.id,
            actor_user_id=actor.id,
            old_value={"is_archived": False},
            new_value={"is_archived": True},
        )
        await self._audit("board.archived", actor_user_id=actor.id, entity_type="kanban_boards", entity_id=board.id)
        await self._emit(
            events.KANBAN_BOARD_ARCHIVED,
            {"board_id": str(board.id), "board_name": board.name, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return board

    # -----------------------------
    # Columns
    # -----------------------------
    async def list_columns(self, board_id: UUID) -> list[KanbanColumn]:
        _ = await self.get_board(board_id)
        return await self.repo.list_columns(board_id)

    async def create_column(self, board_id: UUID, payload: dict, actor: User) -> KanbanColumn:
        board = await self.get_board(board_id)
        if not board.is_active or board.is_archived:
            raise HTTPException(status_code=400, detail="Quadro inativo ou arquivado")
        if not payload.get("name"):
            raise HTTPException(status_code=400, detail="Nome da coluna obrigatorio")

        column = KanbanColumn(
            board_id=board.id,
            name=payload["name"],
            key=payload.get("key"),
            description=payload.get("description"),
            order_index=payload["order_index"],
            color=payload.get("color"),
            wip_limit=payload.get("wip_limit"),
            is_done=payload.get("is_done", False),
            is_active=True,
            metadata_json=payload.get("metadata") or {},
        )
        await self.repo.create_column(column)
        await self._activity(
            "column.created",
            board_id=board.id,
            actor_user_id=actor.id,
            new_value={"column_id": str(column.id), "name": column.name, "order_index": column.order_index},
        )
        await self._emit(
            events.KANBAN_COLUMN_CREATED,
            {"board_id": str(board.id), "column_id": str(column.id), "column_name": column.name, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return column

    async def update_column(self, column_id: UUID, payload: dict, actor: User) -> KanbanColumn:
        column = await self.repo.get_column(column_id)
        if column is None:
            raise HTTPException(status_code=404, detail="Coluna nao encontrada")
        old = {"name": column.name, "order_index": column.order_index, "is_done": column.is_done, "is_active": column.is_active}

        for field in ("name", "description", "order_index", "color", "wip_limit", "is_done", "is_active"):
            if field in payload and payload[field] is not None:
                setattr(column, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            column.metadata_json = payload["metadata"]
        await self.repo.update_column(column)

        await self._activity(
            "column.updated",
            board_id=column.board_id,
            actor_user_id=actor.id,
            old_value=old,
            new_value=payload,
        )
        await self._emit(
            events.KANBAN_COLUMN_UPDATED,
            {"board_id": str(column.board_id), "column_id": str(column.id), "column_name": column.name, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return column

    async def delete_column(self, column_id: UUID, actor: User, *, force: bool = False) -> None:
        column = await self.repo.get_column(column_id)
        if column is None:
            raise HTTPException(status_code=404, detail="Coluna nao encontrada")
        count = await self.repo.count_cards_in_column(column.id)
        if count > 0 and not force:
            raise HTTPException(status_code=400, detail="Coluna possui cards. Use force=true (admin) para remover.")
        if count > 0 and force and not actor.is_superuser:
            # Nota: o router valida permissao kanban.column.delete. Aqui reforcamos o force.
            raise HTTPException(status_code=403, detail="Somente admin pode forcar exclusao de coluna com cards")

        await self.repo.delete_column(column)
        await self._activity("column.deleted", board_id=column.board_id, actor_user_id=actor.id, metadata={"column_id": str(column.id), "force": force})

    async def reorder_columns(self, board_id: UUID, columns: list[dict], actor: User) -> list[KanbanColumn]:
        board = await self.get_board(board_id)
        existing = {c.id: c for c in await self.repo.list_columns(board.id)}
        updates: list[tuple[str, int]] = []
        for item in columns:
            col_id = item["column_id"]
            if col_id not in existing:
                raise HTTPException(status_code=400, detail="Coluna invalida para este quadro")
            existing[col_id].order_index = item["order_index"]
            updates.append((str(col_id), item["order_index"]))
        await self.session.flush()

        await self._activity(
            "column.reordered",
            board_id=board.id,
            actor_user_id=actor.id,
            new_value={"columns": updates},
        )
        await self._emit(
            events.KANBAN_COLUMN_REORDERED,
            {"board_id": str(board.id), "column_orders": updates, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return sorted(existing.values(), key=lambda c: c.order_index)

    # -----------------------------
    # Cards
    # -----------------------------
    async def list_cards(
        self,
        board_id: UUID,
        *,
        column_id: UUID | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[KanbanCard]:
        _ = await self.get_board(board_id)
        return await self.repo.list_cards(board_id=board_id, column_id=column_id, limit=limit, offset=offset)

    async def get_card(self, card_id: UUID) -> KanbanCard:
        card = await self.repo.get_card(card_id)
        if card is None or card.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Card nao encontrado")
        return card

    async def create_card(self, payload: dict, actor: User) -> KanbanCard:
        board = await self.get_board(payload["board_id"])
        if not board.is_active or board.is_archived:
            raise HTTPException(status_code=400, detail="Quadro inativo ou arquivado")
        column = await self.repo.get_column(payload["column_id"])
        if column is None:
            raise HTTPException(status_code=404, detail="Coluna nao encontrada")
        if column.board_id != board.id:
            raise HTTPException(status_code=400, detail="Coluna nao pertence ao quadro")
        metadata = await self._validate_card_metadata(board, payload.get("metadata") or {})

        card = KanbanCard(
            board_id=board.id,
            column_id=column.id,
            card_type_id=payload.get("card_type_id"),
            title=payload["title"],
            description=payload.get("description"),
            code=payload.get("code"),
            priority=payload.get("priority", "medium"),
            status=payload.get("status"),
            order_index=payload.get("order_index", 0),
            due_date=payload.get("due_date"),
            start_date=payload.get("start_date"),
            created_by=actor.id,
            assigned_to=payload.get("assigned_to"),
            is_archived=False,
            metadata_json=metadata,
        )
        await self.repo.create_card(card)
        await self._activity(
            "card.created",
            board_id=board.id,
            card_id=card.id,
            actor_user_id=actor.id,
            new_value={"title": card.title, "column_id": str(card.column_id), "order_index": card.order_index},
        )
        await self._audit("card.created", actor_user_id=actor.id, entity_type="kanban_cards", entity_id=card.id, metadata={"board_id": str(board.id)})
        await self._emit(
            events.KANBAN_CARD_CREATED,
            {"board_id": str(board.id), "card_id": str(card.id), "column_id": str(column.id), "card_title": card.title, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        return card

    async def update_card(self, card_id: UUID, payload: dict, actor: User) -> KanbanCard:
        card = await self.get_card(card_id)
        board = await self.get_board(card.board_id)
        old = {"title": card.title, "description": card.description, "priority": card.priority, "status": card.status, "assigned_to": str(card.assigned_to) if card.assigned_to else None}

        assigned_changed = "assigned_to" in payload and payload.get("assigned_to") != card.assigned_to
        for field in ("title", "description", "code", "priority", "status", "order_index", "due_date", "start_date", "assigned_to"):
            if field in payload and payload[field] is not None:
                setattr(card, field, payload[field])
        if "metadata" in payload and payload["metadata"] is not None:
            card.metadata_json = await self._validate_card_metadata(board, payload["metadata"])
        await self.repo.update_card(card)

        await self._activity("card.updated", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, old_value=old, new_value=payload)
        await self._audit("card.updated", actor_user_id=actor.id, entity_type="kanban_cards", entity_id=card.id, metadata=payload)
        await self._emit(
            events.KANBAN_CARD_UPDATED,
            {"board_id": str(card.board_id), "card_id": str(card.id), "card_title": card.title, "actor_user_id": str(actor.id)},
            publish_to_user_id=actor.id,
        )
        if assigned_changed and card.assigned_to:
            await self._emit(
                events.KANBAN_CARD_ASSIGNED,
                {"board_id": str(card.board_id), "card_id": str(card.id), "assigned_user_id": str(card.assigned_to), "actor_user_id": str(actor.id)},
                publish_to_user_id=actor.id,
            )
        return card

    async def _validate_card_metadata(self, board: KanbanBoard, metadata: dict) -> dict:
        config = normalize_board_config(board.metadata_json)
        validated = validate_card_metadata_for_board(config, metadata)
        user_field_keys = {field.key for field in config.card.fields if field.type == "user"}
        custom_fields = validated.get("customFields") or {}
        if self.session is not None:
            for key in user_field_keys:
                value = custom_fields.get(key)
                if not value:
                    continue
                user = await self.session.get(User, UUID(str(value)))
                if user is None:
                    raise HTTPException(status_code=422, detail=f"Usuario informado no campo {key} nao existe")
        return validated

    async def move_card(self, card_id: UUID, to_column_id: UUID, new_order_index: int, actor: User) -> KanbanCard:
        card = await self.get_card(card_id)
        dest = await self.repo.get_column(to_column_id)
        if dest is None:
            raise HTTPException(status_code=404, detail="Coluna de destino nao encontrada")
        if dest.board_id != card.board_id:
            raise HTTPException(status_code=400, detail="Coluna de destino pertence a outro quadro")

        def _sort_cards_for_ordering(cards: list[KanbanCard]) -> list[KanbanCard]:
            # O repo lista por (order_index, created_at desc), mas mantemos um sort defensivo
            # pois o FakeRepo de testes nao garante ordenacao.
            def key(c: KanbanCard):
                created_at = getattr(c, "created_at", None)
                created_ts = created_at.timestamp() if created_at else 0
                return (c.order_index, -created_ts)

            return sorted(cards, key=key)

        async def _normalize_column(_board_id: UUID, _column_id: UUID, cards: list[KanbanCard]) -> None:
            # Normaliza order_index para evitar buracos/duplicados.
            # IMPORTANTE: a lista recebida já deve estar na ordem final desejada.
            for idx, c in enumerate(cards):
                c.order_index = idx
            for c in cards:
                await self.repo.update_card(c)

        old_column_id = card.column_id
        old_order_index = card.order_index

        # Move + normaliza ordem (suporta mover dentro da mesma coluna).
        if old_column_id == dest.id:
            column_cards = await self.repo.list_cards(board_id=card.board_id, column_id=dest.id, limit=200, offset=0)
            column_cards = _sort_cards_for_ordering(column_cards)
            current_index = next((i for i, c in enumerate(column_cards) if c.id == card.id), None)
            if current_index is None:
                # fallback: inclui o card na lista
                column_cards.append(card)
                current_index = len(column_cards) - 1

            moving = column_cards.pop(current_index)
            target_index = max(0, min(int(new_order_index), len(column_cards)))
            column_cards.insert(target_index, moving)

            await _normalize_column(card.board_id, dest.id, column_cards)
            new_order_index = next((i for i, c in enumerate(column_cards) if c.id == card.id), target_index)
        else:
            # Remove do source e insere no destino na posicao pedida.
            source_cards = await self.repo.list_cards(board_id=card.board_id, column_id=old_column_id, limit=200, offset=0)
            dest_cards = await self.repo.list_cards(board_id=card.board_id, column_id=dest.id, limit=200, offset=0)
            source_cards = _sort_cards_for_ordering([c for c in source_cards if c.id != card.id])
            dest_cards = _sort_cards_for_ordering(dest_cards)

            card.column_id = dest.id
            target_index = max(0, min(int(new_order_index), len(dest_cards)))
            dest_cards.insert(target_index, card)

            await _normalize_column(card.board_id, old_column_id, source_cards)
            await _normalize_column(card.board_id, dest.id, dest_cards)
            new_order_index = next((i for i, c in enumerate(dest_cards) if c.id == card.id), target_index)

        await self._activity(
            "card.moved",
            board_id=card.board_id,
            card_id=card.id,
            actor_user_id=actor.id,
            old_value={"from_column_id": str(old_column_id), "old_order_index": old_order_index},
            new_value={"to_column_id": str(dest.id), "new_order_index": new_order_index},
        )
        await self._audit(
            "card.moved",
            actor_user_id=actor.id,
            entity_type="kanban_cards",
            entity_id=card.id,
            metadata={"from_column_id": str(old_column_id), "to_column_id": str(dest.id), "old_order_index": old_order_index, "new_order_index": new_order_index},
        )
        await self._emit(
            events.KANBAN_CARD_MOVED,
            {
                "board_id": str(card.board_id),
                "card_id": str(card.id),
                "from_column_id": str(old_column_id),
                "to_column_id": str(dest.id),
                "old_order_index": old_order_index,
                "new_order_index": new_order_index,
                "actor_user_id": str(actor.id),
            },
            publish_to_user_id=actor.id,
        )
        return card

    async def archive_card(self, card_id: UUID, actor: User) -> KanbanCard:
        card = await self.get_card(card_id)
        if card.is_archived:
            return card
        card.is_archived = True
        card.archived_at = datetime.now(UTC)
        await self.repo.update_card(card)
        await self._activity("card.archived", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id)
        await self._audit("card.archived", actor_user_id=actor.id, entity_type="kanban_cards", entity_id=card.id)
        await self._emit(events.KANBAN_CARD_ARCHIVED, {"board_id": str(card.board_id), "card_id": str(card.id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return card

    async def restore_card(self, card_id: UUID, actor: User) -> KanbanCard:
        card = await self.get_card(card_id)
        if not card.is_archived:
            return card
        card.is_archived = False
        card.archived_at = None
        await self.repo.update_card(card)
        await self._activity("card.restored", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id)
        await self._emit(events.KANBAN_CARD_RESTORED, {"board_id": str(card.board_id), "card_id": str(card.id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return card

    async def soft_delete_card(self, card_id: UUID, actor: User) -> KanbanCard:
        card = await self.get_card(card_id)
        await self.repo.soft_delete_card(card)
        await self._activity("card.deleted", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id)
        await self._audit("card.deleted", actor_user_id=actor.id, entity_type="kanban_cards", entity_id=card.id)
        await self._emit(events.KANBAN_CARD_DELETED, {"board_id": str(card.board_id), "card_id": str(card.id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return card

    # -----------------------------
    # Assignees
    # -----------------------------
    async def add_assignee(self, card_id: UUID, user_id: UUID, role: str | None, actor: User) -> KanbanCardAssignee:
        card = await self.get_card(card_id)
        assignee = KanbanCardAssignee(card_id=card.id, user_id=user_id, role=role)
        await self.repo.add_assignee(assignee)
        card.assigned_to = user_id
        await self.repo.update_card(card)
        await self._activity("card.assigned", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, new_value={"user_id": str(user_id), "role": role})
        await self._emit(events.KANBAN_CARD_ASSIGNED, {"board_id": str(card.board_id), "card_id": str(card.id), "assigned_user_id": str(user_id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return assignee

    async def remove_assignee(self, card_id: UUID, user_id: UUID, actor: User) -> None:
        card = await self.get_card(card_id)
        await self.repo.remove_assignee(card.id, user_id)
        if card.assigned_to == user_id:
            card.assigned_to = None
            await self.repo.update_card(card)
        await self._activity("card.assigned", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, metadata={"removed_user_id": str(user_id)})

    # -----------------------------
    # Checklist
    # -----------------------------
    async def list_checklist(self, card_id: UUID) -> list[KanbanChecklistItem]:
        _ = await self.get_card(card_id)
        return await self.repo.get_checklist_items(card_id)

    async def create_checklist_item(self, card_id: UUID, payload: dict, actor: User) -> KanbanChecklistItem:
        card = await self.get_card(card_id)
        item = KanbanChecklistItem(
            card_id=card.id,
            title=payload["title"],
            description=payload.get("description"),
            order_index=payload.get("order_index", 0),
            is_done=False,
        )
        await self.repo.create_checklist_item(item)
        await self._activity("checklist.item.created", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, new_value={"item_id": str(item.id), "title": item.title})
        await self._emit(events.KANBAN_CHECKLIST_CREATED, {"board_id": str(card.board_id), "card_id": str(card.id), "item_id": str(item.id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return item

    async def update_checklist_item(self, item_id: UUID, payload: dict, actor: User) -> KanbanChecklistItem:
        item = await self.repo.get_checklist_item(item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Checklist item nao encontrado")
        card = await self.get_card(item.card_id)
        old_done = item.is_done
        for field in ("title", "description", "order_index"):
            if field in payload and payload[field] is not None:
                setattr(item, field, payload[field])
        if "is_done" in payload and payload["is_done"] is not None:
            item.is_done = payload["is_done"]
            if item.is_done and not old_done:
                item.done_by = actor.id
                item.done_at = datetime.now(UTC)
            if not item.is_done:
                item.done_by = None
                item.done_at = None
        await self.repo.update_checklist_item(item)
        await self._activity("checklist.item.updated", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, metadata={"item_id": str(item.id)})
        await self._emit(events.KANBAN_CHECKLIST_UPDATED, {"board_id": str(card.board_id), "card_id": str(card.id), "item_id": str(item.id), "is_done": item.is_done, "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return item

    async def delete_checklist_item(self, item_id: UUID, actor: User) -> None:
        item = await self.repo.get_checklist_item(item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Checklist item nao encontrado")
        card = await self.get_card(item.card_id)
        await self.repo.delete_checklist_item(item)
        await self._activity("checklist.item.deleted", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, metadata={"item_id": str(item_id)})

    # -----------------------------
    # Comments
    # -----------------------------
    async def list_comments(self, card_id: UUID) -> list[KanbanComment]:
        _ = await self.get_card(card_id)
        return await self.repo.get_comments(card_id)

    async def create_comment(self, card_id: UUID, content: str, actor: User) -> KanbanComment:
        card = await self.get_card(card_id)
        comment = KanbanComment(card_id=card.id, user_id=actor.id, content=content)
        await self.repo.create_comment(comment)
        await self._activity("card.comment.created", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, new_value={"comment_id": str(comment.id)})
        await self._emit(events.KANBAN_COMMENT_CREATED, {"board_id": str(card.board_id), "card_id": str(card.id), "comment_id": str(comment.id), "user_id": str(actor.id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return comment

    async def update_comment(self, comment_id: UUID, content: str, actor: User) -> KanbanComment:
        comment = await self.repo.get_comment(comment_id)
        if comment is None or comment.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Comentario nao encontrado")
        if comment.user_id != actor.id and not actor.is_superuser:
            raise HTTPException(status_code=403, detail="Somente autor ou admin pode editar comentario")
        comment.content = content
        comment.edited_at = datetime.now(UTC)
        await self.repo.update_comment(comment)
        card = await self.get_card(comment.card_id)
        await self._activity("card.comment.updated", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, metadata={"comment_id": str(comment.id)})
        await self._emit(events.KANBAN_COMMENT_UPDATED, {"board_id": str(card.board_id), "card_id": str(card.id), "comment_id": str(comment.id), "user_id": str(comment.user_id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return comment

    async def delete_comment(self, comment_id: UUID, actor: User) -> None:
        comment = await self.repo.get_comment(comment_id)
        if comment is None or comment.deleted_at is not None:
            raise HTTPException(status_code=404, detail="Comentario nao encontrado")
        if comment.user_id != actor.id and not actor.is_superuser:
            raise HTTPException(status_code=403, detail="Somente autor ou admin pode excluir comentario")
        await self.repo.soft_delete_comment(comment)
        card = await self.get_card(comment.card_id)
        await self._activity("card.comment.deleted", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, metadata={"comment_id": str(comment.id)})
        await self._emit(events.KANBAN_COMMENT_DELETED, {"board_id": str(card.board_id), "card_id": str(card.id), "comment_id": str(comment.id), "user_id": str(comment.user_id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)

    # -----------------------------
    # Attachments
    # -----------------------------
    async def list_attachments(self, card_id: UUID) -> list[KanbanAttachment]:
        _ = await self.get_card(card_id)
        return await self.repo.get_attachments(card_id)

    async def create_attachment(self, card_id: UUID, file_id: UUID, actor: User) -> KanbanAttachment:
        card = await self.get_card(card_id)
        if not await self.repo.file_exists(file_id):
            raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
        if await self.repo.attachment_exists(card.id, file_id):
            raise HTTPException(status_code=409, detail="Arquivo ja anexado a este card")
        attachment = KanbanAttachment(card_id=card.id, file_id=file_id, uploaded_by=actor.id)
        await self.repo.create_attachment(attachment)
        await self._activity("card.attachment.created", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, new_value={"attachment_id": str(attachment.id), "file_id": str(file_id)})
        await self._emit(events.KANBAN_ATTACHMENT_CREATED, {"board_id": str(card.board_id), "card_id": str(card.id), "attachment_id": str(attachment.id), "file_id": str(file_id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)
        return attachment

    async def delete_attachment(self, card_id: UUID, attachment_id: UUID, actor: User) -> None:
        card = await self.get_card(card_id)
        attachment = await self.repo.get_attachment(attachment_id)
        if attachment is None or attachment.card_id != card.id:
            raise HTTPException(status_code=404, detail="Anexo nao encontrado")
        await self.repo.delete_attachment(attachment)
        await self._activity("card.attachment.deleted", board_id=card.board_id, card_id=card.id, actor_user_id=actor.id, metadata={"attachment_id": str(attachment_id), "file_id": str(attachment.file_id)})
        await self._emit(events.KANBAN_ATTACHMENT_DELETED, {"board_id": str(card.board_id), "card_id": str(card.id), "attachment_id": str(attachment.id), "file_id": str(attachment.file_id), "actor_user_id": str(actor.id)}, publish_to_user_id=actor.id)

    # -----------------------------
    # Activity read
    # -----------------------------
    async def card_activity(self, card_id: UUID, limit: int = 50) -> list[KanbanActivityLog]:
        # Permitimos consultar historico mesmo para cards com soft delete,
        # pois a auditoria/atividade pode ser necessaria para investigacao.
        card = await self.repo.get_card(card_id)
        if card is None:
            raise HTTPException(status_code=404, detail="Card nao encontrado")
        return await self.repo.get_card_activity(card_id, limit=limit)

    async def board_activity(self, board_id: UUID, limit: int = 50) -> list[KanbanActivityLog]:
        _ = await self.get_board(board_id)
        return await self.repo.get_board_activity(board_id, limit=limit)

    # -----------------------------
    # Board permissions (futuro: liberar quadro por usuario/perfil)
    # -----------------------------
    async def list_board_permissions(self, board_id: UUID) -> list[KanbanBoardPermission]:
        _ = await self.get_board(board_id)
        return await self.repo.get_board_permissions(board_id)

    async def create_board_permission(self, board_id: UUID, payload: dict, actor: User) -> KanbanBoardPermission:
        board = await self.get_board(board_id)
        user_id = payload.get("user_id")
        role_id = payload.get("role_id")
        if not user_id and not role_id:
            raise HTTPException(status_code=400, detail="user_id ou role_id deve ser informado")
        permission = KanbanBoardPermission(
            board_id=board.id,
            user_id=user_id,
            role_id=role_id,
            permission_key=payload["permission_key"],
        )
        await self.repo.create_board_permission(permission)
        await self._activity("board.permission.updated", board_id=board.id, actor_user_id=actor.id, new_value={"permission_key": permission.permission_key})
        await self._audit(
            "board.permission.updated",
            actor_user_id=actor.id,
            entity_type="kanban_board_permissions",
            entity_id=permission.id,
            metadata={"board_id": str(board.id), "permission_key": permission.permission_key},
        )
        return permission

    async def delete_board_permission(self, board_id: UUID, permission_id: UUID, actor: User) -> None:
        _ = await self.get_board(board_id)
        permission = await self.session.get(KanbanBoardPermission, permission_id)
        if permission is None or permission.board_id != board_id:
            raise HTTPException(status_code=404, detail="Permissao do quadro nao encontrada")
        await self.repo.delete_board_permission(permission)
        await self._activity("board.permission.updated", board_id=board_id, actor_user_id=actor.id, metadata={"deleted_permission_id": str(permission_id)})
