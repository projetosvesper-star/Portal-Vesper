"""Permissoes do Kanban Producao."""

KANBAN_PRODUCAO_VIEW = "kanban_producao.view"
KANBAN_PRODUCAO_OP_VIEW = "kanban_producao.op.view"
KANBAN_PRODUCAO_OP_CREATE = "kanban_producao.op.create"
KANBAN_PRODUCAO_OP_EDIT = "kanban_producao.op.edit"
KANBAN_PRODUCAO_OP_ARCHIVE = "kanban_producao.op.archive"
KANBAN_PRODUCAO_OP_RESTORE = "kanban_producao.op.restore"
KANBAN_PRODUCAO_OP_DELETE = "kanban_producao.op.delete"
KANBAN_PRODUCAO_OP_MOVE = "kanban_producao.op.move"
KANBAN_PRODUCAO_CHECKLIST_VIEW = "kanban_producao.checklist.view"
KANBAN_PRODUCAO_CHECKLIST_EDIT = "kanban_producao.checklist.edit"
KANBAN_PRODUCAO_TEMPLATES_VIEW = "kanban_producao.templates.view"
KANBAN_PRODUCAO_TEMPLATES_MANAGE = "kanban_producao.templates.manage"
KANBAN_PRODUCAO_TV_VIEW = "kanban_producao.tv.view"
KANBAN_PRODUCAO_HISTORY_VIEW = "kanban_producao.history.view"
KANBAN_PRODUCAO_ADMIN = "kanban_producao.admin"

KANBAN_PRODUCAO_PERMISSION_DEFINITIONS: list[tuple[str, str, str | None]] = [
    (KANBAN_PRODUCAO_VIEW, "Ver Kanban Producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_VIEW, "Ver ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_CREATE, "Criar ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_EDIT, "Editar ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_ARCHIVE, "Arquivar ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_RESTORE, "Restaurar ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_DELETE, "Excluir ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_OP_MOVE, "Mover ordens de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_CHECKLIST_VIEW, "Ver checklist de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_CHECKLIST_EDIT, "Editar checklist de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_TEMPLATES_VIEW, "Ver templates de checklist", "kanban_producao"),
    (KANBAN_PRODUCAO_TEMPLATES_MANAGE, "Gerenciar templates de checklist", "kanban_producao"),
    (KANBAN_PRODUCAO_TV_VIEW, "Ver TV/Foco de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_HISTORY_VIEW, "Ver historico de producao", "kanban_producao"),
    (KANBAN_PRODUCAO_ADMIN, "Administrar Kanban Producao", "kanban_producao"),
]

GESTOR_PRODUCAO_PERMISSIONS = [
    KANBAN_PRODUCAO_VIEW,
    KANBAN_PRODUCAO_OP_VIEW,
    KANBAN_PRODUCAO_OP_CREATE,
    KANBAN_PRODUCAO_OP_EDIT,
    KANBAN_PRODUCAO_OP_ARCHIVE,
    KANBAN_PRODUCAO_OP_MOVE,
    KANBAN_PRODUCAO_CHECKLIST_VIEW,
    KANBAN_PRODUCAO_CHECKLIST_EDIT,
    KANBAN_PRODUCAO_TEMPLATES_VIEW,
    KANBAN_PRODUCAO_TEMPLATES_MANAGE,
    KANBAN_PRODUCAO_TV_VIEW,
    KANBAN_PRODUCAO_HISTORY_VIEW,
]

PRODUCAO_ROLE_PERMISSIONS = [
    KANBAN_PRODUCAO_VIEW,
    KANBAN_PRODUCAO_OP_VIEW,
    KANBAN_PRODUCAO_OP_CREATE,
    KANBAN_PRODUCAO_OP_EDIT,
    KANBAN_PRODUCAO_OP_MOVE,
    KANBAN_PRODUCAO_CHECKLIST_VIEW,
    KANBAN_PRODUCAO_CHECKLIST_EDIT,
    KANBAN_PRODUCAO_TEMPLATES_VIEW,
    KANBAN_PRODUCAO_TV_VIEW,
    KANBAN_PRODUCAO_HISTORY_VIEW,
]

USUARIO_PRODUCAO_PERMISSIONS = [
    KANBAN_PRODUCAO_VIEW,
    KANBAN_PRODUCAO_OP_VIEW,
    KANBAN_PRODUCAO_CHECKLIST_VIEW,
    KANBAN_PRODUCAO_TV_VIEW,
]
