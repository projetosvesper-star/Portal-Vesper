"""Repository layer for Kanban Producao."""

from __future__ import annotations

from typing import TypeVar
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.kanban.models import KanbanBoard, KanbanCard, KanbanColumn
from app.modules.production.models import (
    ProductionChecklistTemplate,
    ProductionChecklistTemplateItem,
    ProductionOrder,
    ProductionOrderActivityLog,
    ProductionOrderChecklistItem,
)

T = TypeVar("T")


class ProductionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _flush_refresh(self, entity: T) -> T:
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def get_board_by_key(self, key: str) -> KanbanBoard | None:
        return await self.session.scalar(select(KanbanBoard).where(KanbanBoard.key == key))

    async def get_column_by_key(self, board_id: UUID, key: str) -> KanbanColumn | None:
        return await self.session.scalar(
            select(KanbanColumn).where(KanbanColumn.board_id == board_id, KanbanColumn.key == key)
        )

    async def list_columns(self, board_id: UUID) -> list[KanbanColumn]:
        result = await self.session.execute(
            select(KanbanColumn).where(KanbanColumn.board_id == board_id).order_by(KanbanColumn.order_index)
        )
        return list(result.scalars().all())

    async def next_card_order(self, board_id: UUID, column_id: UUID) -> int:
        result = await self.session.execute(
            select(func.max(KanbanCard.order_index)).where(
                KanbanCard.board_id == board_id,
                KanbanCard.column_id == column_id,
                KanbanCard.deleted_at.is_(None),
            )
        )
        current = result.scalar()
        return int(current or 0) + 1

    async def add(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        return entity

    async def update(self, entity: T) -> T:
        return await self._flush_refresh(entity)

    async def get_order(self, order_id: UUID) -> ProductionOrder | None:
        return await self.session.get(ProductionOrder, order_id)

    async def get_order_detail(self, order_id: UUID) -> ProductionOrder | None:
        result = await self.session.execute(
            select(ProductionOrder)
            .options(selectinload(ProductionOrder.checklist_items))
            .where(ProductionOrder.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_order_by_numero(self, numero_op: str) -> ProductionOrder | None:
        return await self.session.scalar(select(ProductionOrder).where(ProductionOrder.numero_op == numero_op))

    async def list_orders(
        self,
        *,
        include_archived: bool = False,
        include_deleted: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ProductionOrder]:
        query = select(ProductionOrder)
        conditions = []
        if not include_archived:
            conditions.append(ProductionOrder.is_archived.is_(False))
        if not include_deleted:
            conditions.append(ProductionOrder.deleted_at.is_(None))
        if conditions:
            query = query.where(and_(*conditions))
        query = query.order_by(
            ProductionOrder.status,
            ProductionOrder.prioridade.desc(),
            ProductionOrder.data_entrega.asc().nulls_last(),
            ProductionOrder.created_at.desc(),
        ).limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def list_template_items(self, template_id: UUID) -> list[ProductionChecklistTemplateItem]:
        result = await self.session.execute(
            select(ProductionChecklistTemplateItem)
            .where(ProductionChecklistTemplateItem.template_id == template_id)
            .order_by(ProductionChecklistTemplateItem.order_index)
        )
        return list(result.scalars().all())

    async def get_default_template(self) -> ProductionChecklistTemplate | None:
        result = await self.session.execute(
            select(ProductionChecklistTemplate)
            .options(selectinload(ProductionChecklistTemplate.items))
            .where(
                ProductionChecklistTemplate.template_type == "producao",
                ProductionChecklistTemplate.is_default.is_(True),
                ProductionChecklistTemplate.is_active.is_(True),
            )
            .order_by(ProductionChecklistTemplate.created_at)
        )
        return result.scalars().first()

    async def get_template(self, template_id: UUID) -> ProductionChecklistTemplate | None:
        result = await self.session.execute(
            select(ProductionChecklistTemplate)
            .options(selectinload(ProductionChecklistTemplate.items))
            .where(ProductionChecklistTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def list_templates(self, include_inactive: bool = False) -> list[ProductionChecklistTemplate]:
        query = select(ProductionChecklistTemplate).options(selectinload(ProductionChecklistTemplate.items))
        if not include_inactive:
            query = query.where(ProductionChecklistTemplate.is_active.is_(True))
        query = query.order_by(ProductionChecklistTemplate.template_type, ProductionChecklistTemplate.name)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_template_item(self, item_id: UUID) -> ProductionChecklistTemplateItem | None:
        return await self.session.get(ProductionChecklistTemplateItem, item_id)

    async def get_checklist_item(self, item_id: UUID) -> ProductionOrderChecklistItem | None:
        return await self.session.get(ProductionOrderChecklistItem, item_id)

    async def list_checklist_items(self, order_id: UUID) -> list[ProductionOrderChecklistItem]:
        result = await self.session.execute(
            select(ProductionOrderChecklistItem)
            .where(ProductionOrderChecklistItem.production_order_id == order_id)
            .order_by(ProductionOrderChecklistItem.order_index)
        )
        return list(result.scalars().all())

    async def delete(self, entity: object) -> None:
        await self.session.delete(entity)

    async def create_activity_log(self, log: ProductionOrderActivityLog) -> ProductionOrderActivityLog:
        self.session.add(log)
        await self.session.flush()
        return log

    async def list_activity(self, order_id: UUID, limit: int = 100) -> list[ProductionOrderActivityLog]:
        result = await self.session.execute(
            select(ProductionOrderActivityLog)
            .where(ProductionOrderActivityLog.production_order_id == order_id)
            .order_by(ProductionOrderActivityLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def dashboard_counts(self) -> dict[str, int]:
        result = await self.session.execute(
            select(ProductionOrder.status, func.count())
            .where(ProductionOrder.deleted_at.is_(None))
            .group_by(ProductionOrder.status)
        )
        return {status: int(count) for status, count in result.all()}

    async def average_checklist_percent(self) -> float:
        result = await self.session.execute(
            select(func.avg(ProductionOrder.percentual_checklist)).where(ProductionOrder.deleted_at.is_(None))
        )
        return float(result.scalar() or 0)
