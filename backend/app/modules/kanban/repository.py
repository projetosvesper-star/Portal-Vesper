"""Repository layer for Kanban Engine."""

from __future__ import annotations

from uuid import UUID
from typing import Any

from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.kanban.models import (
    KanbanBoard,
    KanbanColumn,
    KanbanCard,
    KanbanCardType,
    KanbanCardAssignee,
    KanbanChecklistItem,
    KanbanComment,
    KanbanAttachment,
    KanbanActivityLog,
    KanbanBoardPermission,
)


class KanbanRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # Board operations
    async def get_board(self, board_id: UUID) -> KanbanBoard | None:
        return await self.session.get(KanbanBoard, board_id)

    async def get_board_by_key(self, key: str) -> KanbanBoard | None:
        result = await self.session.execute(
            select(KanbanBoard).where(KanbanBoard.key == key)
        )
        return result.scalar_one_or_none()

    async def list_boards(
        self,
        board_type: str | None = None,
        module_context: str | None = None,
        is_active: bool | None = None,
        is_archived: bool | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[KanbanBoard]:
        query = select(KanbanBoard)
        
        conditions = []
        if board_type is not None:
            conditions.append(KanbanBoard.board_type == board_type)
        if module_context is not None:
            conditions.append(KanbanBoard.module_context == module_context)
        if is_active is not None:
            conditions.append(KanbanBoard.is_active == is_active)
        if is_archived is not None:
            conditions.append(KanbanBoard.is_archived == is_archived)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(KanbanBoard.created_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_board(self, board: KanbanBoard) -> KanbanBoard:
        self.session.add(board)
        await self.session.flush()
        return board

    async def update_board(self, board: KanbanBoard) -> KanbanBoard:
        await self.session.flush()
        return board

    async def archive_board(self, board: KanbanBoard) -> KanbanBoard:
        board.is_archived = True
        await self.session.flush()
        return board

    async def delete_board(self, board: KanbanBoard) -> None:
        await self.session.delete(board)

    # Column operations
    async def get_column(self, column_id: UUID) -> KanbanColumn | None:
        return await self.session.get(KanbanColumn, column_id)

    async def list_columns(
        self,
        board_id: UUID,
        is_active: bool | None = None,
    ) -> list[KanbanColumn]:
        query = select(KanbanColumn).where(KanbanColumn.board_id == board_id)
        
        if is_active is not None:
            query = query.where(KanbanColumn.is_active == is_active)
        
        query = query.order_by(KanbanColumn.order_index)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_column(self, column: KanbanColumn) -> KanbanColumn:
        self.session.add(column)
        await self.session.flush()
        return column

    async def update_column(self, column: KanbanColumn) -> KanbanColumn:
        await self.session.flush()
        return column

    async def delete_column(self, column: KanbanColumn) -> None:
        await self.session.delete(column)

    async def count_cards_in_column(self, column_id: UUID) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(KanbanCard).where(KanbanCard.column_id == column_id)
        )
        return result.scalar() or 0

    # Card type operations
    async def get_card_type(self, card_type_id: UUID) -> KanbanCardType | None:
        return await self.session.get(KanbanCardType, card_type_id)

    async def list_card_types(
        self,
        board_id: UUID | None = None,
        is_active: bool | None = None,
    ) -> list[KanbanCardType]:
        query = select(KanbanCardType)
        
        conditions = []
        if board_id is not None:
            conditions.append(KanbanCardType.board_id == board_id)
        if is_active is not None:
            conditions.append(KanbanCardType.is_active == is_active)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(KanbanCardType.name)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_card_type(self, card_type: KanbanCardType) -> KanbanCardType:
        self.session.add(card_type)
        await self.session.flush()
        return card_type

    async def update_card_type(self, card_type: KanbanCardType) -> KanbanCardType:
        await self.session.flush()
        return card_type

    # Card operations
    async def get_card(self, card_id: UUID) -> KanbanCard | None:
        return await self.session.get(KanbanCard, card_id)

    async def get_card_with_relations(self, card_id: UUID) -> KanbanCard | None:
        result = await self.session.execute(
            select(KanbanCard)
            .options(
                selectinload(KanbanCard.assignees),
                selectinload(KanbanCard.checklist_items),
                selectinload(KanbanCard.comments),
                selectinload(KanbanCard.attachments),
            )
            .where(KanbanCard.id == card_id)
        )
        return result.scalar_one_or_none()

    async def list_cards(
        self,
        board_id: UUID,
        column_id: UUID | None = None,
        assigned_to: UUID | None = None,
        is_archived: bool | None = None,
        priority: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[KanbanCard]:
        query = select(KanbanCard).where(KanbanCard.board_id == board_id)
        
        conditions = []
        if column_id is not None:
            conditions.append(KanbanCard.column_id == column_id)
        if assigned_to is not None:
            conditions.append(KanbanCard.assigned_to == assigned_to)
        if is_archived is not None:
            conditions.append(KanbanCard.is_archived == is_archived)
        if priority is not None:
            conditions.append(KanbanCard.priority == priority)
        
        conditions.append(KanbanCard.deleted_at.is_(None))
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(KanbanCard.order_index, KanbanCard.created_at.desc()).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create_card(self, card: KanbanCard) -> KanbanCard:
        self.session.add(card)
        await self.session.flush()
        return card

    async def update_card(self, card: KanbanCard) -> KanbanCard:
        await self.session.flush()
        return card

    async def archive_card(self, card: KanbanCard) -> KanbanCard:
        card.is_archived = True
        await self.session.flush()
        return card

    async def restore_card(self, card: KanbanCard) -> KanbanCard:
        card.is_archived = False
        card.archived_at = None
        await self.session.flush()
        return card

    async def soft_delete_card(self, card: KanbanCard) -> KanbanCard:
        from datetime import datetime
        card.deleted_at = datetime.now()
        await self.session.flush()
        return card

    async def delete_card(self, card: KanbanCard) -> None:
        await self.session.delete(card)

    # Assignee operations
    async def get_card_assignees(self, card_id: UUID) -> list[KanbanCardAssignee]:
        result = await self.session.execute(
            select(KanbanCardAssignee).where(KanbanCardAssignee.card_id == card_id)
        )
        return list(result.scalars().all())

    async def add_assignee(self, assignee: KanbanCardAssignee) -> KanbanCardAssignee:
        self.session.add(assignee)
        await self.session.flush()
        return assignee

    async def remove_assignee(self, card_id: UUID, user_id: UUID) -> None:
        result = await self.session.execute(
            select(KanbanCardAssignee).where(
                and_(KanbanCardAssignee.card_id == card_id, KanbanCardAssignee.user_id == user_id)
            )
        )
        assignee = result.scalar_one_or_none()
        if assignee:
            await self.session.delete(assignee)

    async def clear_assignees(self, card_id: UUID) -> None:
        result = await self.session.execute(
            select(KanbanCardAssignee).where(KanbanCardAssignee.card_id == card_id)
        )
        for assignee in result.scalars().all():
            await self.session.delete(assignee)

    # Checklist operations
    async def get_checklist_items(self, card_id: UUID) -> list[KanbanChecklistItem]:
        result = await self.session.execute(
            select(KanbanChecklistItem)
            .where(KanbanChecklistItem.card_id == card_id)
            .order_by(KanbanChecklistItem.order_index)
        )
        return list(result.scalars().all())

    async def get_checklist_item(self, item_id: UUID) -> KanbanChecklistItem | None:
        return await self.session.get(KanbanChecklistItem, item_id)

    async def create_checklist_item(self, item: KanbanChecklistItem) -> KanbanChecklistItem:
        self.session.add(item)
        await self.session.flush()
        return item

    async def update_checklist_item(self, item: KanbanChecklistItem) -> KanbanChecklistItem:
        await self.session.flush()
        return item

    async def delete_checklist_item(self, item: KanbanChecklistItem) -> None:
        await self.session.delete(item)

    # Comment operations
    async def get_comments(self, card_id: UUID) -> list[KanbanComment]:
        result = await self.session.execute(
            select(KanbanComment)
            .where(KanbanComment.card_id == card_id, KanbanComment.deleted_at.is_(None))
            .order_by(KanbanComment.created_at)
        )
        return list(result.scalars().all())

    async def get_comment(self, comment_id: UUID) -> KanbanComment | None:
        return await self.session.get(KanbanComment, comment_id)

    async def create_comment(self, comment: KanbanComment) -> KanbanComment:
        self.session.add(comment)
        await self.session.flush()
        return comment

    async def update_comment(self, comment: KanbanComment) -> KanbanComment:
        await self.session.flush()
        return comment

    async def soft_delete_comment(self, comment: KanbanComment) -> KanbanComment:
        from datetime import datetime
        comment.deleted_at = datetime.now()
        await self.session.flush()
        return comment

    # Attachment operations
    async def get_attachments(self, card_id: UUID) -> list[KanbanAttachment]:
        result = await self.session.execute(
            select(KanbanAttachment).where(KanbanAttachment.card_id == card_id)
        )
        return list(result.scalars().all())

    async def get_attachment(self, attachment_id: UUID) -> KanbanAttachment | None:
        return await self.session.get(KanbanAttachment, attachment_id)

    async def create_attachment(self, attachment: KanbanAttachment) -> KanbanAttachment:
        self.session.add(attachment)
        await self.session.flush()
        return attachment

    async def delete_attachment(self, attachment: KanbanAttachment) -> None:
        await self.session.delete(attachment)

    async def attachment_exists(self, card_id: UUID, file_id: UUID) -> bool:
        result = await self.session.execute(
            select(KanbanAttachment).where(
                and_(KanbanAttachment.card_id == card_id, KanbanAttachment.file_id == file_id)
            )
        )
        return result.scalar_one_or_none() is not None

    # Activity log operations
    async def create_activity_log(self, log: KanbanActivityLog) -> KanbanActivityLog:
        self.session.add(log)
        await self.session.flush()
        return log

    async def get_card_activity(self, card_id: UUID, limit: int = 50) -> list[KanbanActivityLog]:
        result = await self.session.execute(
            select(KanbanActivityLog)
            .where(KanbanActivityLog.card_id == card_id)
            .order_by(KanbanActivityLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_board_activity(self, board_id: UUID, limit: int = 50) -> list[KanbanActivityLog]:
        result = await self.session.execute(
            select(KanbanActivityLog)
            .where(KanbanActivityLog.board_id == board_id)
            .order_by(KanbanActivityLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    # Board permission operations
    async def get_board_permissions(self, board_id: UUID) -> list[KanbanBoardPermission]:
        result = await self.session.execute(
            select(KanbanBoardPermission).where(KanbanBoardPermission.board_id == board_id)
        )
        return list(result.scalars().all())

    async def create_board_permission(self, permission: KanbanBoardPermission) -> KanbanBoardPermission:
        self.session.add(permission)
        await self.session.flush()
        return permission

    async def delete_board_permission(self, permission: KanbanBoardPermission) -> None:
        await self.session.delete(permission)
