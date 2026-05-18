"""Rotas do Kanban Engine (/api/kanban/*)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.permissions import require_permission
from app.models import User
from app.modules.kanban.permissions import (
    KANBAN_ACTIVITY_VIEW,
    KANBAN_BOARD_CREATE,
    KANBAN_BOARD_DELETE,
    KANBAN_BOARD_EDIT,
    KANBAN_BOARD_MANAGE_PERMISSIONS,
    KANBAN_BOARD_VIEW,
    KANBAN_CARD_ARCHIVE,
    KANBAN_CARD_ATTACH,
    KANBAN_CARD_CHECKLIST,
    KANBAN_CARD_COMMENT,
    KANBAN_CARD_CREATE,
    KANBAN_CARD_DELETE,
    KANBAN_CARD_EDIT,
    KANBAN_CARD_MOVE,
    KANBAN_CARD_RESTORE,
    KANBAN_CARD_VIEW,
    KANBAN_COLUMN_CREATE,
    KANBAN_COLUMN_DELETE,
    KANBAN_COLUMN_EDIT,
    KANBAN_COLUMN_REORDER,
    KANBAN_COLUMN_VIEW,
)
from app.modules.kanban.schemas import (
    ActivityLogRead,
    AttachmentCreate,
    AttachmentRead,
    BoardCreate,
    BoardPermissionCreate,
    BoardPermissionRead,
    BoardRead,
    BoardUpdate,
    CardAssigneeCreate,
    CardAssigneeRead,
    CardCreate,
    CardMoveRequest,
    CardRead,
    CardUpdate,
    ChecklistItemCreate,
    ChecklistItemRead,
    ChecklistItemUpdate,
    ColumnCreate,
    ColumnRead,
    ColumnReorderRequest,
    ColumnUpdate,
    CommentCreate,
    CommentRead,
    CommentUpdate,
)
from app.modules.kanban.service import KanbanService

router = APIRouter(prefix="/kanban", tags=["Kanban"])


# -----------------------------
# Boards
# -----------------------------
@router.get("/boards", response_model=list[BoardRead])
async def list_boards(
    board_type: str | None = None,
    module_context: str | None = None,
    include_archived: bool = False,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_permission(KANBAN_BOARD_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[BoardRead]:
    service = KanbanService(session)
    boards = await service.list_boards(
        board_type=board_type,
        module_context=module_context,
        include_archived=include_archived,
        limit=limit,
        offset=offset,
    )
    return [BoardRead.model_validate(b) for b in boards]


@router.post("/boards", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
async def create_board(
    payload: BoardCreate,
    current_user: User = Depends(require_permission(KANBAN_BOARD_CREATE)),
    session: AsyncSession = Depends(get_session),
) -> BoardRead:
    service = KanbanService(session)
    board = await service.create_board(payload.model_dump(), current_user)
    return BoardRead.model_validate(board)


@router.get("/boards/{board_id}", response_model=BoardRead)
async def get_board(
    board_id: UUID,
    _: User = Depends(require_permission(KANBAN_BOARD_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> BoardRead:
    service = KanbanService(session)
    return BoardRead.model_validate(await service.get_board(board_id))


@router.patch("/boards/{board_id}", response_model=BoardRead)
async def update_board(
    board_id: UUID,
    payload: BoardUpdate,
    current_user: User = Depends(require_permission(KANBAN_BOARD_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> BoardRead:
    service = KanbanService(session)
    board = await service.update_board(board_id, payload.model_dump(exclude_unset=True), current_user)
    return BoardRead.model_validate(board)


@router.delete("/boards/{board_id}", response_model=BoardRead)
async def archive_board(
    board_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_BOARD_DELETE)),
    session: AsyncSession = Depends(get_session),
) -> BoardRead:
    service = KanbanService(session)
    board = await service.archive_board(board_id, current_user)
    return BoardRead.model_validate(board)


# Board permissions
@router.get("/boards/{board_id}/permissions", response_model=list[BoardPermissionRead])
async def list_board_permissions(
    board_id: UUID,
    _: User = Depends(require_permission(KANBAN_BOARD_MANAGE_PERMISSIONS)),
    session: AsyncSession = Depends(get_session),
) -> list[BoardPermissionRead]:
    service = KanbanService(session)
    rows = await service.list_board_permissions(board_id)
    return [BoardPermissionRead.model_validate(r) for r in rows]


@router.post("/boards/{board_id}/permissions", response_model=BoardPermissionRead, status_code=status.HTTP_201_CREATED)
async def create_board_permission(
    board_id: UUID,
    payload: BoardPermissionCreate,
    current_user: User = Depends(require_permission(KANBAN_BOARD_MANAGE_PERMISSIONS)),
    session: AsyncSession = Depends(get_session),
) -> BoardPermissionRead:
    service = KanbanService(session)
    row = await service.create_board_permission(board_id, payload.model_dump(), current_user)
    return BoardPermissionRead.model_validate(row)


@router.delete("/boards/{board_id}/permissions/{permission_id}")
async def delete_board_permission(
    board_id: UUID,
    permission_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_BOARD_MANAGE_PERMISSIONS)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = KanbanService(session)
    await service.delete_board_permission(board_id, permission_id, current_user)
    return {"message": "Permissao removida"}


# -----------------------------
# Columns
# -----------------------------
@router.get("/boards/{board_id}/columns", response_model=list[ColumnRead])
async def list_columns(
    board_id: UUID,
    _: User = Depends(require_permission(KANBAN_COLUMN_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ColumnRead]:
    service = KanbanService(session)
    columns = await service.list_columns(board_id)
    return [ColumnRead.model_validate(c) for c in columns]


@router.post("/boards/{board_id}/columns", response_model=ColumnRead, status_code=status.HTTP_201_CREATED)
async def create_column(
    board_id: UUID,
    payload: ColumnCreate,
    current_user: User = Depends(require_permission(KANBAN_COLUMN_CREATE)),
    session: AsyncSession = Depends(get_session),
) -> ColumnRead:
    service = KanbanService(session)
    column = await service.create_column(board_id, payload.model_dump(), current_user)
    return ColumnRead.model_validate(column)


@router.patch("/columns/{column_id}", response_model=ColumnRead)
async def update_column(
    column_id: UUID,
    payload: ColumnUpdate,
    current_user: User = Depends(require_permission(KANBAN_COLUMN_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> ColumnRead:
    service = KanbanService(session)
    column = await service.update_column(column_id, payload.model_dump(exclude_unset=True), current_user)
    return ColumnRead.model_validate(column)


@router.delete("/columns/{column_id}")
async def delete_column(
    column_id: UUID,
    force: bool = Query(False),
    current_user: User = Depends(require_permission(KANBAN_COLUMN_DELETE)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = KanbanService(session)
    await service.delete_column(column_id, current_user, force=force)
    return {"message": "Coluna removida"}


@router.post("/boards/{board_id}/columns/reorder", response_model=list[ColumnRead])
async def reorder_columns(
    board_id: UUID,
    payload: ColumnReorderRequest,
    current_user: User = Depends(require_permission(KANBAN_COLUMN_REORDER)),
    session: AsyncSession = Depends(get_session),
) -> list[ColumnRead]:
    service = KanbanService(session)
    updated = await service.reorder_columns(
        board_id,
        [item.model_dump() for item in payload.columns],
        current_user,
    )
    return [ColumnRead.model_validate(c) for c in updated]


# -----------------------------
# Cards
# -----------------------------
@router.get("/boards/{board_id}/cards", response_model=list[CardRead])
async def list_cards(
    board_id: UUID,
    column_id: UUID | None = None,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_permission(KANBAN_CARD_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[CardRead]:
    service = KanbanService(session)
    cards = await service.list_cards(board_id, column_id=column_id, limit=limit, offset=offset)
    return [CardRead.model_validate(c) for c in cards]


@router.post("/cards", response_model=CardRead, status_code=status.HTTP_201_CREATED)
async def create_card(
    payload: CardCreate,
    current_user: User = Depends(require_permission(KANBAN_CARD_CREATE)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    card = await service.create_card(payload.model_dump(), current_user)
    return CardRead.model_validate(card)


@router.get("/cards/{card_id}", response_model=CardRead)
async def get_card(
    card_id: UUID,
    _: User = Depends(require_permission(KANBAN_CARD_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    return CardRead.model_validate(await service.get_card(card_id))


@router.patch("/cards/{card_id}", response_model=CardRead)
async def update_card(
    card_id: UUID,
    payload: CardUpdate,
    current_user: User = Depends(require_permission(KANBAN_CARD_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    card = await service.update_card(card_id, payload.model_dump(exclude_unset=True), current_user)
    return CardRead.model_validate(card)


@router.delete("/cards/{card_id}", response_model=CardRead)
async def delete_card(
    card_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_CARD_DELETE)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    card = await service.soft_delete_card(card_id, current_user)
    return CardRead.model_validate(card)


@router.post("/cards/{card_id}/move", response_model=CardRead)
async def move_card(
    card_id: UUID,
    payload: CardMoveRequest,
    current_user: User = Depends(require_permission(KANBAN_CARD_MOVE)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    card = await service.move_card(card_id, payload.to_column_id, payload.new_order_index, current_user)
    return CardRead.model_validate(card)


@router.post("/cards/{card_id}/archive", response_model=CardRead)
async def archive_card(
    card_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_CARD_ARCHIVE)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    return CardRead.model_validate(await service.archive_card(card_id, current_user))


@router.post("/cards/{card_id}/restore", response_model=CardRead)
async def restore_card(
    card_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_CARD_RESTORE)),
    session: AsyncSession = Depends(get_session),
) -> CardRead:
    service = KanbanService(session)
    return CardRead.model_validate(await service.restore_card(card_id, current_user))


# -----------------------------
# Assignees
# -----------------------------
@router.post("/cards/{card_id}/assignees", response_model=CardAssigneeRead, status_code=status.HTTP_201_CREATED)
async def add_assignee(
    card_id: UUID,
    payload: CardAssigneeCreate,
    current_user: User = Depends(require_permission("kanban.card.assign")),
    session: AsyncSession = Depends(get_session),
) -> CardAssigneeRead:
    service = KanbanService(session)
    row = await service.add_assignee(card_id, payload.user_id, payload.role, current_user)
    return CardAssigneeRead.model_validate(row)


@router.delete("/cards/{card_id}/assignees/{user_id}")
async def remove_assignee(
    card_id: UUID,
    user_id: UUID,
    current_user: User = Depends(require_permission("kanban.card.assign")),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = KanbanService(session)
    await service.remove_assignee(card_id, user_id, current_user)
    return {"message": "Responsavel removido"}


# -----------------------------
# Checklist
# -----------------------------
@router.get("/cards/{card_id}/checklist", response_model=list[ChecklistItemRead])
async def list_checklist(
    card_id: UUID,
    _: User = Depends(require_permission(KANBAN_CARD_CHECKLIST)),
    session: AsyncSession = Depends(get_session),
) -> list[ChecklistItemRead]:
    service = KanbanService(session)
    items = await service.list_checklist(card_id)
    return [ChecklistItemRead.model_validate(i) for i in items]


@router.post("/cards/{card_id}/checklist", response_model=ChecklistItemRead, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    card_id: UUID,
    payload: ChecklistItemCreate,
    current_user: User = Depends(require_permission(KANBAN_CARD_CHECKLIST)),
    session: AsyncSession = Depends(get_session),
) -> ChecklistItemRead:
    service = KanbanService(session)
    item = await service.create_checklist_item(card_id, payload.model_dump(), current_user)
    return ChecklistItemRead.model_validate(item)


@router.patch("/checklist/{item_id}", response_model=ChecklistItemRead)
async def update_checklist_item(
    item_id: UUID,
    payload: ChecklistItemUpdate,
    current_user: User = Depends(require_permission(KANBAN_CARD_CHECKLIST)),
    session: AsyncSession = Depends(get_session),
) -> ChecklistItemRead:
    service = KanbanService(session)
    item = await service.update_checklist_item(item_id, payload.model_dump(exclude_unset=True), current_user)
    return ChecklistItemRead.model_validate(item)


@router.delete("/checklist/{item_id}")
async def delete_checklist_item(
    item_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_CARD_CHECKLIST)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = KanbanService(session)
    await service.delete_checklist_item(item_id, current_user)
    return {"message": "Checklist removido"}


# -----------------------------
# Comments
# -----------------------------
@router.get("/cards/{card_id}/comments", response_model=list[CommentRead])
async def list_comments(
    card_id: UUID,
    _: User = Depends(require_permission(KANBAN_CARD_COMMENT)),
    session: AsyncSession = Depends(get_session),
) -> list[CommentRead]:
    service = KanbanService(session)
    comments = await service.list_comments(card_id)
    return [CommentRead.model_validate(c) for c in comments]


@router.post("/cards/{card_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    card_id: UUID,
    payload: CommentCreate,
    current_user: User = Depends(require_permission(KANBAN_CARD_COMMENT)),
    session: AsyncSession = Depends(get_session),
) -> CommentRead:
    service = KanbanService(session)
    comment = await service.create_comment(card_id, payload.content, current_user)
    return CommentRead.model_validate(comment)


@router.patch("/comments/{comment_id}", response_model=CommentRead)
async def update_comment(
    comment_id: UUID,
    payload: CommentUpdate,
    current_user: User = Depends(require_permission(KANBAN_CARD_COMMENT)),
    session: AsyncSession = Depends(get_session),
) -> CommentRead:
    service = KanbanService(session)
    comment = await service.update_comment(comment_id, payload.content, current_user)
    return CommentRead.model_validate(comment)


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_CARD_COMMENT)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = KanbanService(session)
    await service.delete_comment(comment_id, current_user)
    return {"message": "Comentario removido"}


# -----------------------------
# Attachments
# -----------------------------
@router.get("/cards/{card_id}/attachments", response_model=list[AttachmentRead])
async def list_attachments(
    card_id: UUID,
    _: User = Depends(require_permission(KANBAN_CARD_ATTACH)),
    session: AsyncSession = Depends(get_session),
) -> list[AttachmentRead]:
    service = KanbanService(session)
    rows = await service.list_attachments(card_id)
    return [AttachmentRead.model_validate(r) for r in rows]


@router.post("/cards/{card_id}/attachments", response_model=AttachmentRead, status_code=status.HTTP_201_CREATED)
async def create_attachment(
    card_id: UUID,
    payload: AttachmentCreate,
    current_user: User = Depends(require_permission(KANBAN_CARD_ATTACH)),
    session: AsyncSession = Depends(get_session),
) -> AttachmentRead:
    service = KanbanService(session)
    row = await service.create_attachment(card_id, payload.file_id, current_user)
    return AttachmentRead.model_validate(row)


@router.delete("/cards/{card_id}/attachments/{attachment_id}")
async def delete_attachment(
    card_id: UUID,
    attachment_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_CARD_ATTACH)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = KanbanService(session)
    await service.delete_attachment(card_id, attachment_id, current_user)
    return {"message": "Anexo removido"}


# -----------------------------
# Activity
# -----------------------------
@router.get("/cards/{card_id}/activity", response_model=list[ActivityLogRead])
async def card_activity(
    card_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_permission(KANBAN_ACTIVITY_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ActivityLogRead]:
    service = KanbanService(session)
    rows = await service.card_activity(card_id, limit=limit)
    return [ActivityLogRead.model_validate(r) for r in rows]


@router.get("/boards/{board_id}/activity", response_model=list[ActivityLogRead])
async def board_activity(
    board_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(require_permission(KANBAN_ACTIVITY_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ActivityLogRead]:
    service = KanbanService(session)
    rows = await service.board_activity(board_id, limit=limit)
    return [ActivityLogRead.model_validate(r) for r in rows]

