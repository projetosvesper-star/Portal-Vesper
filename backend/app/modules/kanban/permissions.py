"""Permissoes do Kanban Engine.

Este arquivo centraliza as chaves para uso no router, seeds e documentacao.
"""

KANBAN_VIEW = "kanban.view"

KANBAN_BOARD_VIEW = "kanban.board.view"
KANBAN_BOARD_CREATE = "kanban.board.create"
KANBAN_BOARD_EDIT = "kanban.board.edit"
KANBAN_BOARD_DELETE = "kanban.board.delete"
KANBAN_BOARD_MANAGE_PERMISSIONS = "kanban.board.manage_permissions"

KANBAN_COLUMN_VIEW = "kanban.column.view"
KANBAN_COLUMN_CREATE = "kanban.column.create"
KANBAN_COLUMN_EDIT = "kanban.column.edit"
KANBAN_COLUMN_DELETE = "kanban.column.delete"
KANBAN_COLUMN_REORDER = "kanban.column.reorder"

KANBAN_CARD_VIEW = "kanban.card.view"
KANBAN_CARD_CREATE = "kanban.card.create"
KANBAN_CARD_EDIT = "kanban.card.edit"
KANBAN_CARD_DELETE = "kanban.card.delete"
KANBAN_CARD_ARCHIVE = "kanban.card.archive"
KANBAN_CARD_RESTORE = "kanban.card.restore"
KANBAN_CARD_MOVE = "kanban.card.move"
KANBAN_CARD_REORDER = "kanban.card.reorder"
KANBAN_CARD_ASSIGN = "kanban.card.assign"
KANBAN_CARD_COMMENT = "kanban.card.comment"
KANBAN_CARD_ATTACH = "kanban.card.attach"
KANBAN_CARD_CHECKLIST = "kanban.card.checklist"

KANBAN_ACTIVITY_VIEW = "kanban.activity.view"
KANBAN_AUDIT_VIEW = "kanban.audit.view"
KANBAN_ADMIN = "kanban.admin"


KANBAN_PERMISSION_DEFINITIONS: list[tuple[str, str, str | None]] = [
    (KANBAN_VIEW, "Ver Kanban", "kanban"),
    (KANBAN_BOARD_VIEW, "Ver quadros", "kanban"),
    (KANBAN_BOARD_CREATE, "Criar quadros", "kanban"),
    (KANBAN_BOARD_EDIT, "Editar quadros", "kanban"),
    (KANBAN_BOARD_DELETE, "Arquivar quadros", "kanban"),
    (KANBAN_BOARD_MANAGE_PERMISSIONS, "Gerenciar permissoes do quadro", "kanban"),
    (KANBAN_COLUMN_VIEW, "Ver colunas", "kanban"),
    (KANBAN_COLUMN_CREATE, "Criar colunas", "kanban"),
    (KANBAN_COLUMN_EDIT, "Editar colunas", "kanban"),
    (KANBAN_COLUMN_DELETE, "Excluir colunas", "kanban"),
    (KANBAN_COLUMN_REORDER, "Reordenar colunas", "kanban"),
    (KANBAN_CARD_VIEW, "Ver cartoes", "kanban"),
    (KANBAN_CARD_CREATE, "Criar cartoes", "kanban"),
    (KANBAN_CARD_EDIT, "Editar cartoes", "kanban"),
    (KANBAN_CARD_DELETE, "Excluir cartoes", "kanban"),
    (KANBAN_CARD_ARCHIVE, "Arquivar cartoes", "kanban"),
    (KANBAN_CARD_RESTORE, "Restaurar cartoes", "kanban"),
    (KANBAN_CARD_MOVE, "Mover cartoes", "kanban"),
    (KANBAN_CARD_REORDER, "Reordenar cartoes", "kanban"),
    (KANBAN_CARD_ASSIGN, "Atribuir cartoes", "kanban"),
    (KANBAN_CARD_COMMENT, "Comentar em cartoes", "kanban"),
    (KANBAN_CARD_ATTACH, "Anexar arquivos em cartoes", "kanban"),
    (KANBAN_CARD_CHECKLIST, "Gerenciar checklist de cartoes", "kanban"),
    (KANBAN_ACTIVITY_VIEW, "Ver atividades Kanban", "kanban"),
    (KANBAN_AUDIT_VIEW, "Ver auditoria Kanban", "kanban"),
    (KANBAN_ADMIN, "Admin Kanban (acoes forçadas)", "kanban"),
]

