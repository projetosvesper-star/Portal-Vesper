"""Initial development seed for Portal Vesper."""

import asyncio

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import ModulePermission, Permission, PortalModule, Role, User
from app.modules.kanban.models import KanbanBoard, KanbanCard, KanbanCardType, KanbanColumn
from app.modules.kanban.permissions import KANBAN_PERMISSION_DEFINITIONS

MODULES = [
    {"key": "chat", "name": "Chat Interno", "description": "Comunicacao interna em tempo real.", "route": "/chat", "icon": "MessageCircle", "order_index": 10},
    {"key": "kanban", "name": "Kanban", "description": "Quadros de producao, operacao e projetos.", "route": "/kanban", "icon": "KanbanSquare", "order_index": 20},
    {"key": "propostas", "name": "Propostas", "description": "Gestao de propostas comerciais.", "route": "/propostas", "icon": "FileText", "order_index": 30},
    {"key": "compras", "name": "Compras", "description": "Cotacoes e gestao de compras.", "route": "/compras", "icon": "ShoppingCart", "order_index": 40},
    {"key": "helpdesk", "name": "HelpDesk TI", "description": "Tickets de suporte interno.", "route": "/helpdesk", "icon": "Headphones", "order_index": 50},
    {"key": "controle_ti", "name": "Controle TI", "description": "Inventario e controle de ativos de TI.", "route": "/controle-ti", "icon": "MonitorCog", "order_index": 60},
    {"key": "atalhos", "name": "Atalhos", "description": "Links rapidos para sistemas externos.", "route": "/atalhos", "icon": "Link", "order_index": 70},
    {"key": "ia", "name": "IA Interna", "description": "Assistentes e automacoes com IA.", "route": "/ia", "icon": "Sparkles", "order_index": 80},
    {"key": "automacoes_n8n", "name": "Automacoes n8n", "description": "Monitoramento e controle de workflows n8n.", "route": "/automacoes", "icon": "Network", "order_index": 90},
    {"key": "admin", "name": "Administracao", "description": "Usuarios, perfis, modulos, permissoes e auditoria.", "route": "/admin", "icon": "Shield", "order_index": 100},
]

PERMISSIONS = [
    ("admin.view", "Ver administracao", "admin"),
    ("admin.users.view", "Ver usuarios", "admin"),
    ("admin.users.create", "Criar usuarios", "admin"),
    ("admin.users.edit", "Editar usuarios", "admin"),
    ("admin.users.delete", "Desativar usuarios", "admin"),
    ("admin.roles.view", "Ver perfis", "admin"),
    ("admin.roles.create", "Criar perfis", "admin"),
    ("admin.roles.edit", "Editar perfis", "admin"),
    ("admin.roles.delete", "Excluir perfis", "admin"),
    ("admin.permissions.view", "Ver permissoes", "admin"),
    ("admin.permissions.manage", "Gerenciar permissoes", "admin"),
    ("admin.modules.view", "Ver modulos", "admin"),
    ("admin.modules.manage", "Gerenciar modulos", "admin"),
    ("admin.audit.view", "Ver auditoria", "admin"),
    ("admin.view_as_user", "Visualizar como usuario", "admin"),
    ("chat.view", "Ver chat", "chat"),
    ("chat.send", "Enviar mensagens no chat", "chat"),
    ("propostas.view", "Ver propostas", "propostas"),
    ("propostas.create", "Criar propostas", "propostas"),
    ("compras.view", "Ver compras", "compras"),
    ("compras.cotacoes.view", "Ver cotacoes", "compras"),
    ("helpdesk.view", "Ver HelpDesk", "helpdesk"),
    ("helpdesk.ticket.create", "Criar ticket", "helpdesk"),
    ("helpdesk.ticket.view", "Ver ticket", "helpdesk"),
    ("controle_ti.view", "Ver Controle TI", "controle_ti"),
    ("atalhos.view", "Ver atalhos", "atalhos"),
    ("ia.view", "Ver IA interna", "ia"),
    ("ia.chat", "Usar chat de IA", "ia"),
    ("automacoes_n8n.view", "Ver automacoes n8n", "automacoes_n8n"),
    ("automacoes_n8n.status.view", "Ver status n8n", "automacoes_n8n"),
    ("system.notifications.view", "Ver notificacoes", None),
] + KANBAN_PERMISSION_DEFINITIONS

ROLE_PERMISSION_KEYS = {
    "administrador": [key for key, _, _ in PERMISSIONS],
    "gestor": [
        "chat.view",
        "chat.send",
        # Kanban (Gestor)
        "kanban.view",
        "kanban.board.view",
        "kanban.board.create",
        "kanban.board.edit",
        "kanban.column.view",
        "kanban.card.view",
        "kanban.card.create",
        "kanban.card.edit",
        "kanban.card.move",
        "kanban.card.comment",
        "kanban.card.attach",
        "kanban.card.checklist",
        "kanban.activity.view",
        # Outros modulos
        "propostas.view",
        "compras.view",
        "helpdesk.view",
        "helpdesk.ticket.view",
        "atalhos.view",
        "system.notifications.view",
    ],
    "producao": [
        "chat.view",
        "chat.send",
        "kanban.view",
        "kanban.board.view",
        "kanban.column.view",
        "kanban.card.view",
        "kanban.card.create",
        "kanban.card.edit",
        "kanban.card.move",
        "kanban.card.comment",
        "kanban.card.attach",
        "kanban.card.checklist",
        "kanban.activity.view",
        "helpdesk.view",
        "helpdesk.ticket.create",
        "system.notifications.view",
    ],
    "comercial": [
        "chat.view",
        "chat.send",
        "propostas.view",
        "propostas.create",
        "kanban.view",
        "kanban.board.view",
        "kanban.card.view",
        "kanban.card.comment",
        "atalhos.view",
        "system.notifications.view",
    ],
    "compras": [
        "chat.view",
        "chat.send",
        "compras.view",
        "compras.cotacoes.view",
        "kanban.view",
        "kanban.board.view",
        "kanban.card.view",
        "kanban.card.comment",
        "atalhos.view",
        "system.notifications.view",
    ],
    "ti": [
        "chat.view",
        "chat.send",
        "helpdesk.view",
        "helpdesk.ticket.view",
        "controle_ti.view",
        "kanban.view",
        "kanban.board.view",
        "kanban.card.view",
        "kanban.card.comment",
        "atalhos.view",
        "system.notifications.view",
    ],
    "usuario": [
        "chat.view",
        "chat.send",
        "kanban.view",
        "kanban.board.view",
        "kanban.card.view",
        "atalhos.view",
        "helpdesk.view",
        "helpdesk.ticket.create",
        "system.notifications.view",
    ],
}

ROLES = [
    ("administrador", "Administrador", "Acesso total ao Portal Vesper."),
    ("gestor", "Gestor", "Acesso operacional e gerencial sem administracao total."),
    ("usuario", "Usuario", "Acesso basico aos recursos liberados."),
    ("ti", "TI", "Acesso aos recursos de suporte e controle de TI."),
    ("comercial", "Comercial", "Acesso comercial com propostas e Kanban limitado."),
    ("compras", "Compras", "Acesso ao modulo de compras e Kanban limitado."),
    ("producao", "Producao", "Acesso a Kanban, Chat e HelpDesk limitado."),
]


async def run() -> None:
    settings = get_settings()
    async with AsyncSessionLocal() as session:
        module_by_key: dict[str, PortalModule] = {}
        for item in MODULES:
            module = await session.scalar(select(PortalModule).where(PortalModule.key == item["key"]))
            if module is None:
                module = PortalModule(**item, enabled=True, version="0.1.0")
                session.add(module)
            else:
                for key, value in item.items():
                    setattr(module, key, value)
            module_by_key[item["key"]] = module
        await session.flush()

        permission_by_key: dict[str, Permission] = {}
        for key, description, module_key in PERMISSIONS:
            permission = await session.scalar(select(Permission).where(Permission.key == key))
            if permission is None:
                permission = Permission(key=key, description=description, module_key=module_key)
                session.add(permission)
            else:
                permission.description = description
                permission.module_key = module_key
            permission_by_key[key] = permission
        await session.flush()

        for permission in permission_by_key.values():
            if permission.module_key and permission.module_key in module_by_key:
                exists = await session.scalar(
                    select(ModulePermission).where(
                        ModulePermission.module_id == module_by_key[permission.module_key].id,
                        ModulePermission.permission_id == permission.id,
                    )
                )
                if exists is None:
                    session.add(ModulePermission(module_id=module_by_key[permission.module_key].id, permission_id=permission.id))

        role_by_key: dict[str, Role] = {}
        for key, name, description in ROLES:
            role = await session.scalar(
                select(Role).options(selectinload(Role.permissions)).where(Role.key == key)
            )
            if role is None:
                role = Role(key=key, name=name, description=description)
                session.add(role)
            role.permissions = [permission_by_key[p_key] for p_key in ROLE_PERMISSION_KEYS[key]]
            role_by_key[key] = role
        await session.flush()

        admin = await session.scalar(
            select(User).options(selectinload(User.roles)).where(User.username == "Admin")
        )
        if admin is None:
            admin = User(
                username="Admin",
                name="Administrador",
                password_hash=hash_password("Vesper@890"),
                status="active",
                is_superuser=True,
            )
            session.add(admin)
        admin.roles = [role_by_key["administrador"]]

        # Seed Kanban Engine (somente desenvolvimento)
        if settings.is_development:
            board = await session.scalar(select(KanbanBoard).where(KanbanBoard.key == "producao"))
            if board is None:
                board = KanbanBoard(
                    key="producao",
                    name="Producao",
                    description="Quadro inicial de producao (Kanban Engine).",
                    board_type="production",
                    module_context="producao",
                    is_active=True,
                    is_archived=False,
                    created_by=admin.id,
                    metadata_json={},
                )
                session.add(board)
                await session.flush()

                columns = [
                    ("Fila", 1),
                    ("Em preparacao", 2),
                    ("Em producao", 3),
                    ("Revisao", 4),
                    ("Concluido", 5),
                ]
                for name, order_index in columns:
                    session.add(
                        KanbanColumn(
                            board_id=board.id,
                            name=name,
                            order_index=order_index,
                            is_done=name == "Concluido",
                            is_active=True,
                            metadata_json={},
                        )
                    )
                await session.flush()

                card_type = KanbanCardType(
                    board_id=board.id,
                    key="op",
                    name="Ordem de Producao",
                    description="Tipo base para OP (ainda generico nesta etapa).",
                    schema_json={},
                    is_active=True,
                )
                session.add(card_type)
                await session.flush()

                # Cards de exemplo apenas em desenvolvimento
                first_column = await session.scalar(
                    select(KanbanColumn).where(KanbanColumn.board_id == board.id).order_by(KanbanColumn.order_index)
                )
                if first_column:
                    for idx, code in enumerate(["OP-2026-0001", "OP-2026-0002", "OP-2026-0003"], start=1):
                        session.add(
                            KanbanCard(
                                board_id=board.id,
                                column_id=first_column.id,
                                card_type_id=card_type.id,
                                title=f"Ordem de Producao {code}",
                                code=code,
                                priority="medium",
                                status=None,
                                order_index=idx,
                                created_by=admin.id,
                                assigned_to=None,
                                is_archived=False,
                                metadata_json={},
                            )
                        )

        await session.commit()
        print("Seed inicial aplicado: modulos, permissoes, perfis e usuario Admin.")


if __name__ == "__main__":
    asyncio.run(run())
