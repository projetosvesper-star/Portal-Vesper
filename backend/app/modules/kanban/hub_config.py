"""Configuracao persistente do Hub Kanban em JSONB."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException

from app.modules.kanban.schemas import (
    KanbanBoardConfigRead,
    KanbanBoardTemplate,
    KanbanBoardTemplateCreate,
    KanbanHubContext,
    KanbanHubContextCreate,
)

HUB_CONFIG_BOARD_KEY = "__kanban_hub_config__"
HUB_CONFIG_METADATA_KEY = "hubConfig"


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def default_hub_contexts() -> list[KanbanHubContext]:
    return [
        KanbanHubContext(
            key="quadros",
            name="Quadros",
            description="Todos os quadros do Kanban Engine.",
            kind="system",
            boardType=None,
            moduleContext=None,
            route=None,
            icon="KanbanSquare",
            order=10,
            visible=True,
            isSystem=True,
            requiredPermission="kanban.board.view",
        ),
        KanbanHubContext(
            key="producao",
            name="Producao",
            description="OPs simples e checklist editavel.",
            kind="specialized",
            route="/kanban/producao",
            icon="Factory",
            order=20,
            visible=True,
            isSystem=True,
            requiredPermission="kanban_producao.view",
        ),
        KanbanHubContext(
            key="projetos",
            name="Projetos",
            description="Quadros de projetos e tarefas.",
            kind="generic",
            boardType="projects",
            moduleContext="projetos",
            icon="FolderKanban",
            order=30,
            visible=True,
            isSystem=True,
            requiredPermission="kanban.board.view",
        ),
        KanbanHubContext(
            key="ti_operacional",
            name="TI / Operacional",
            description="Quadros de TI, suporte e fluxos operacionais.",
            kind="generic",
            boardType="operational",
            moduleContext="ti",
            icon="MonitorCog",
            order=40,
            visible=True,
            isSystem=True,
            requiredPermission="kanban.board.view",
        ),
        KanbanHubContext(
            key="personalizados",
            name="Personalizados",
            description="Fluxos customizados por equipe.",
            kind="generic",
            boardType="custom",
            moduleContext="outro",
            icon="SlidersHorizontal",
            order=50,
            visible=True,
            isSystem=True,
            requiredPermission="kanban.board.view",
        ),
        KanbanHubContext(
            key="tv_foco",
            name="TV/Foco",
            description="Visualizacao para acompanhamento em tela.",
            kind="specialized",
            route="/kanban/tv",
            icon="Tv",
            order=60,
            visible=True,
            isSystem=True,
            requiredPermission="kanban.board.view",
        ),
    ]


def _config(**kwargs: Any) -> KanbanBoardConfigRead:
    base = KanbanBoardConfigRead().model_dump(mode="json")
    for key, value in kwargs.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = {**base[key], **value}
        else:
            base[key] = value
    return KanbanBoardConfigRead.model_validate(base)


def default_board_templates() -> list[KanbanBoardTemplate]:
    defaults: list[KanbanBoardTemplateCreate] = [
        KanbanBoardTemplateCreate(
            key="basico",
            name="Basico",
            description="Fluxo simples para qualquer equipe.",
            boardType="custom",
            moduleContext="outro",
            icon="KanbanSquare",
            order=10,
            columns=[
                {"name": "A fazer", "key": "a_fazer", "order": 10},
                {"name": "Em andamento", "key": "em_andamento", "order": 20},
                {"name": "Revisao", "key": "revisao", "order": 30},
                {"name": "Concluido", "key": "concluido", "order": 40, "isDone": True},
            ],
            config=_config(),
        ),
        KanbanBoardTemplateCreate(
            key="projetos",
            name="Projetos",
            description="Template para projetos e tarefas.",
            boardType="projects",
            moduleContext="projetos",
            icon="FolderKanban",
            order=20,
            columns=[
                {"name": "Backlog", "key": "backlog", "order": 10},
                {"name": "Planejamento", "key": "planejamento", "order": 20},
                {"name": "Em execucao", "key": "em_execucao", "order": 30},
                {"name": "Validacao", "key": "validacao", "order": 40},
                {"name": "Entregue", "key": "entregue", "order": 50, "isDone": True},
            ],
            config=_config(
                terminology={
                    "itemSingular": "Tarefa",
                    "itemPlural": "Tarefas",
                    "newItemLabel": "Nova tarefa",
                    "editItemLabel": "Editar tarefa",
                    "itemTitleLabel": "Titulo da tarefa",
                    "itemDescriptionLabel": "Descricao da tarefa",
                    "emptyStateText": "Nenhuma tarefa encontrada",
                }
            ),
        ),
        KanbanBoardTemplateCreate(
            key="ti_chamados",
            name="TI / Chamados",
            description="Template para chamados internos de TI.",
            boardType="operational",
            moduleContext="ti",
            icon="MonitorCog",
            order=30,
            columns=[
                {"name": "Aberto", "key": "aberto", "order": 10},
                {"name": "Em atendimento", "key": "em_atendimento", "order": 20},
                {"name": "Aguardando usuario", "key": "aguardando_usuario", "order": 30},
                {"name": "Resolvido", "key": "resolvido", "order": 40},
                {"name": "Fechado", "key": "fechado", "order": 50, "isDone": True},
            ],
            config=_config(
                terminology={
                    "itemSingular": "Chamado",
                    "itemPlural": "Chamados",
                    "newItemLabel": "Novo chamado",
                    "editItemLabel": "Editar chamado",
                    "emptyStateText": "Nenhum chamado encontrado",
                },
                card={
                    "fields": [
                        {
                            "key": "solicitante",
                            "label": "Solicitante",
                            "type": "text",
                            "required": False,
                            "showInCard": True,
                            "showInDrawer": True,
                            "showInTv": True,
                            "showInFilters": True,
                            "order": 10,
                        }
                    ]
                },
            ),
        ),
        KanbanBoardTemplateCreate(
            key="operacional",
            name="Operacional",
            description="Fluxo operacional generico.",
            boardType="operational",
            moduleContext="operacional",
            icon="Workflow",
            order=40,
            columns=[
                {"name": "Entrada", "key": "entrada", "order": 10},
                {"name": "Execucao", "key": "execucao", "order": 20},
                {"name": "Conferencia", "key": "conferencia", "order": 30},
                {"name": "Finalizado", "key": "finalizado", "order": 40, "isDone": True},
            ],
            config=_config(),
        ),
        KanbanBoardTemplateCreate(
            key="manutencao",
            name="Manutencao",
            description="Ordens simples de manutencao.",
            boardType="operational",
            moduleContext="manutencao",
            icon="Wrench",
            order=50,
            columns=[
                {"name": "Solicitada", "key": "solicitada", "order": 10},
                {"name": "Em manutencao", "key": "em_manutencao", "order": 20},
                {"name": "Aguardando pecas", "key": "aguardando_pecas", "order": 30},
                {"name": "Concluida", "key": "concluida", "order": 40, "isDone": True},
            ],
            config=_config(terminology={"itemSingular": "Ordem", "itemPlural": "Ordens", "newItemLabel": "Nova manutencao"}),
        ),
        KanbanBoardTemplateCreate(
            key="compras_internas",
            name="Compras internas",
            description="Solicitacoes internas de compra.",
            boardType="operational",
            moduleContext="compras",
            icon="ShoppingCart",
            order=60,
            columns=[
                {"name": "Solicitada", "key": "solicitada", "order": 10},
                {"name": "Cotacao", "key": "cotacao", "order": 20},
                {"name": "Aprovacao", "key": "aprovacao", "order": 30},
                {"name": "Comprado", "key": "comprado", "order": 40, "isDone": True},
            ],
            config=_config(terminology={"itemSingular": "Solicitacao", "itemPlural": "Solicitacoes", "newItemLabel": "Nova solicitacao"}),
        ),
        KanbanBoardTemplateCreate(
            key="comercial",
            name="Comercial",
            description="Fluxo simples de negociacoes.",
            boardType="custom",
            moduleContext="comercial",
            icon="Handshake",
            order=70,
            columns=[
                {"name": "Lead", "key": "lead", "order": 10},
                {"name": "Contato", "key": "contato", "order": 20},
                {"name": "Proposta", "key": "proposta", "order": 30},
                {"name": "Fechado", "key": "fechado", "order": 40, "isDone": True},
            ],
            config=_config(terminology={"itemSingular": "Negociacao", "itemPlural": "Negociacoes", "newItemLabel": "Nova negociacao"}),
        ),
        KanbanBoardTemplateCreate(
            key="personalizado",
            name="Personalizado",
            description="Base customizavel para criar um quadro livre.",
            boardType="custom",
            moduleContext="outro",
            icon="SlidersHorizontal",
            order=80,
            columns=[
                {"name": "A fazer", "key": "a_fazer", "order": 10},
                {"name": "Em andamento", "key": "em_andamento", "order": 20},
                {"name": "Concluido", "key": "concluido", "order": 30, "isDone": True},
            ],
            config=_config(),
        ),
    ]
    return [KanbanBoardTemplate.model_validate({**item.model_dump(mode="json"), "isSystem": True, "isActive": True}) for item in defaults]


def normalize_contexts(raw: list[dict[str, Any]] | None) -> list[KanbanHubContext]:
    contexts = [KanbanHubContext.model_validate(item) for item in (raw or [])]
    by_key = {context.key: context for context in contexts}
    for default in default_hub_contexts():
        current = by_key.get(default.key)
        if current is None:
            by_key[default.key] = default
        elif current.isSystem:
            by_key[default.key] = KanbanHubContext.model_validate({**default.model_dump(), **current.model_dump(), "isSystem": True})
    _validate_unique_contexts(list(by_key.values()))
    return sorted(by_key.values(), key=lambda item: item.order)


def normalize_templates(raw: list[dict[str, Any]] | None) -> list[KanbanBoardTemplate]:
    templates = [KanbanBoardTemplate.model_validate(item) for item in (raw or [])]
    by_key = {template.key: template for template in templates}
    for default in default_board_templates():
        current = by_key.get(default.key)
        if current is None:
            by_key[default.key] = default
        elif current.isSystem:
            by_key[default.key] = KanbanBoardTemplate.model_validate({**default.model_dump(mode="json"), **current.model_dump(mode="json"), "isSystem": True})
    _validate_unique_templates(list(by_key.values()))
    return sorted(by_key.values(), key=lambda item: item.order)


def serialize_hub_config(contexts: list[KanbanHubContext], templates: list[KanbanBoardTemplate]) -> dict[str, Any]:
    return {
        "contexts": [context.model_dump(mode="json") for context in contexts],
        "templates": [template.model_dump(mode="json") for template in templates],
        "updatedAt": now_iso(),
    }


def _validate_unique_contexts(contexts: list[KanbanHubContext]) -> None:
    active = [context for context in contexts if context.deletedAt is None]
    keys = [context.key for context in active]
    if len(keys) != len(set(keys)):
        raise HTTPException(status_code=422, detail="Contextos ativos nao podem repetir key")
    routes = [context.route for context in active if context.route]
    if len(routes) != len(set(routes)):
        raise HTTPException(status_code=422, detail="Contextos ativos nao podem repetir route")


def _validate_unique_templates(templates: list[KanbanBoardTemplate]) -> None:
    active = [template for template in templates if template.deletedAt is None]
    keys = [template.key for template in active]
    if len(keys) != len(set(keys)):
        raise HTTPException(status_code=422, detail="Templates ativos nao podem repetir key")
