"""Rotas do Kanban Producao simples (/api/kanban/producao/*)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.permissions import require_permission
from app.models import User
from app.modules.production.permissions import (
    KANBAN_PRODUCAO_CHECKLIST_EDIT,
    KANBAN_PRODUCAO_CHECKLIST_VIEW,
    KANBAN_PRODUCAO_HISTORY_VIEW,
    KANBAN_PRODUCAO_OP_ARCHIVE,
    KANBAN_PRODUCAO_OP_CREATE,
    KANBAN_PRODUCAO_OP_DELETE,
    KANBAN_PRODUCAO_OP_EDIT,
    KANBAN_PRODUCAO_OP_RESTORE,
    KANBAN_PRODUCAO_OP_VIEW,
    KANBAN_PRODUCAO_TEMPLATES_MANAGE,
    KANBAN_PRODUCAO_TEMPLATES_VIEW,
    KANBAN_PRODUCAO_TV_VIEW,
)
from app.modules.production.schemas import (
    ProductionActivityRead,
    ProductionChecklistTemplateCreate,
    ProductionChecklistTemplateItemCreate,
    ProductionChecklistTemplateItemRead,
    ProductionChecklistTemplateItemUpdate,
    ProductionChecklistTemplateRead,
    ProductionChecklistTemplateUpdate,
    ProductionDashboardRead,
    ProductionOrderChecklistItemCreate,
    ProductionOrderChecklistItemRead,
    ProductionOrderChecklistItemUpdate,
    ProductionOrderChecklistReorderRequest,
    ProductionOrderCreate,
    ProductionOrderDetailRead,
    ProductionOrderListItem,
    ProductionOrderRead,
    ProductionOrderUpdate,
    ProductionTVResponse,
)
from app.modules.production.service import ProductionService

router = APIRouter(prefix="/kanban/producao", tags=["Kanban Producao"])


@router.get("/ops", response_model=list[ProductionOrderListItem])
async def list_orders(
    include_archived: bool = False,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_permission(KANBAN_PRODUCAO_OP_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ProductionOrderListItem]:
    service = ProductionService(session)
    rows = await service.list_orders(include_archived=include_archived, limit=limit, offset=offset)
    return [ProductionOrderListItem.model_validate(row) for row in rows]


@router.post("/ops", response_model=ProductionOrderDetailRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: ProductionOrderCreate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_OP_CREATE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderDetailRead:
    service = ProductionService(session)
    row = await service.create_order(payload.model_dump(), current_user)
    return ProductionOrderDetailRead.model_validate(row)


@router.get("/ops/{op_id}", response_model=ProductionOrderDetailRead)
async def get_order(
    op_id: UUID,
    _: User = Depends(require_permission(KANBAN_PRODUCAO_OP_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderDetailRead:
    service = ProductionService(session)
    return ProductionOrderDetailRead.model_validate(await service.get_order(op_id))


@router.patch("/ops/{op_id}", response_model=ProductionOrderRead)
async def update_order(
    op_id: UUID,
    payload: ProductionOrderUpdate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_OP_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderRead:
    service = ProductionService(session)
    row = await service.update_order(op_id, payload.model_dump(exclude_unset=True), current_user)
    return ProductionOrderRead.model_validate(row)


@router.post("/ops/{op_id}/archive", response_model=ProductionOrderRead)
async def archive_order(
    op_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_OP_ARCHIVE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderRead:
    service = ProductionService(session)
    return ProductionOrderRead.model_validate(await service.archive_order(op_id, current_user))


@router.post("/ops/{op_id}/restore", response_model=ProductionOrderRead)
async def restore_order(
    op_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_OP_RESTORE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderRead:
    service = ProductionService(session)
    return ProductionOrderRead.model_validate(await service.restore_order(op_id, current_user))


@router.delete("/ops/{op_id}", response_model=ProductionOrderRead)
async def delete_order(
    op_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_OP_DELETE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderRead:
    service = ProductionService(session)
    return ProductionOrderRead.model_validate(await service.soft_delete_order(op_id, current_user))


@router.get("/ops/{op_id}/checklist", response_model=list[ProductionOrderChecklistItemRead])
async def list_checklist(
    op_id: UUID,
    _: User = Depends(require_permission(KANBAN_PRODUCAO_CHECKLIST_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ProductionOrderChecklistItemRead]:
    service = ProductionService(session)
    rows = await service.list_checklist(op_id)
    return [ProductionOrderChecklistItemRead.model_validate(row) for row in rows]


@router.post("/ops/{op_id}/checklist", response_model=ProductionOrderChecklistItemRead, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    op_id: UUID,
    payload: ProductionOrderChecklistItemCreate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_CHECKLIST_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderChecklistItemRead:
    service = ProductionService(session)
    return ProductionOrderChecklistItemRead.model_validate(await service.create_checklist_item(op_id, payload.model_dump(), current_user))


@router.patch("/checklist/{item_id}", response_model=ProductionOrderChecklistItemRead)
async def update_checklist_item(
    item_id: UUID,
    payload: ProductionOrderChecklistItemUpdate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_CHECKLIST_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> ProductionOrderChecklistItemRead:
    service = ProductionService(session)
    return ProductionOrderChecklistItemRead.model_validate(await service.update_checklist_item(item_id, payload.model_dump(exclude_unset=True), current_user))


@router.delete("/checklist/{item_id}")
async def delete_checklist_item(
    item_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_CHECKLIST_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = ProductionService(session)
    await service.delete_checklist_item(item_id, current_user)
    return {"message": "Item removido"}


@router.post("/ops/{op_id}/checklist/reorder", response_model=list[ProductionOrderChecklistItemRead])
async def reorder_checklist(
    op_id: UUID,
    payload: ProductionOrderChecklistReorderRequest,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_CHECKLIST_EDIT)),
    session: AsyncSession = Depends(get_session),
) -> list[ProductionOrderChecklistItemRead]:
    service = ProductionService(session)
    rows = await service.reorder_checklist(op_id, payload.items, current_user)
    return [ProductionOrderChecklistItemRead.model_validate(row) for row in rows]


@router.get("/checklist-templates", response_model=list[ProductionChecklistTemplateRead])
async def list_templates(
    include_inactive: bool = False,
    _: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ProductionChecklistTemplateRead]:
    service = ProductionService(session)
    rows = await service.list_templates(include_inactive=include_inactive)
    return [ProductionChecklistTemplateRead.model_validate(row) for row in rows]


@router.post("/checklist-templates", response_model=ProductionChecklistTemplateRead, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: ProductionChecklistTemplateCreate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_MANAGE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionChecklistTemplateRead:
    service = ProductionService(session)
    return ProductionChecklistTemplateRead.model_validate(await service.create_template(payload.model_dump(), current_user))


@router.get("/checklist-templates/{template_id}", response_model=ProductionChecklistTemplateRead)
async def get_template(
    template_id: UUID,
    _: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> ProductionChecklistTemplateRead:
    service = ProductionService(session)
    return ProductionChecklistTemplateRead.model_validate(await service.get_template(template_id))


@router.patch("/checklist-templates/{template_id}", response_model=ProductionChecklistTemplateRead)
async def update_template(
    template_id: UUID,
    payload: ProductionChecklistTemplateUpdate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_MANAGE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionChecklistTemplateRead:
    service = ProductionService(session)
    return ProductionChecklistTemplateRead.model_validate(await service.update_template(template_id, payload.model_dump(exclude_unset=True), current_user))


@router.delete("/checklist-templates/{template_id}")
async def delete_template(
    template_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_MANAGE)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = ProductionService(session)
    await service.delete_template(template_id, current_user)
    return {"message": "Template desativado"}


@router.post("/checklist-templates/{template_id}/items", response_model=ProductionChecklistTemplateItemRead, status_code=status.HTTP_201_CREATED)
async def create_template_item(
    template_id: UUID,
    payload: ProductionChecklistTemplateItemCreate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_MANAGE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionChecklistTemplateItemRead:
    service = ProductionService(session)
    return ProductionChecklistTemplateItemRead.model_validate(await service.create_template_item(template_id, payload.model_dump(), current_user))


@router.patch("/checklist-template-items/{item_id}", response_model=ProductionChecklistTemplateItemRead)
async def update_template_item(
    item_id: UUID,
    payload: ProductionChecklistTemplateItemUpdate,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_MANAGE)),
    session: AsyncSession = Depends(get_session),
) -> ProductionChecklistTemplateItemRead:
    service = ProductionService(session)
    return ProductionChecklistTemplateItemRead.model_validate(await service.update_template_item(item_id, payload.model_dump(exclude_unset=True), current_user))


@router.delete("/checklist-template-items/{item_id}")
async def delete_template_item(
    item_id: UUID,
    current_user: User = Depends(require_permission(KANBAN_PRODUCAO_TEMPLATES_MANAGE)),
    session: AsyncSession = Depends(get_session),
) -> dict:
    service = ProductionService(session)
    await service.delete_template_item(item_id, current_user)
    return {"message": "Item de template removido"}


@router.get("/dashboard", response_model=ProductionDashboardRead)
async def dashboard(
    _: User = Depends(require_permission(KANBAN_PRODUCAO_OP_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> ProductionDashboardRead:
    service = ProductionService(session)
    return ProductionDashboardRead.model_validate(await service.dashboard())


@router.get("/tv", response_model=ProductionTVResponse)
async def tv(
    mode: str = Query("list", pattern="^(list|kanban)$"),
    limit: int = Query(50, ge=1, le=200),
    include_done: bool = True,
    _: User = Depends(require_permission(KANBAN_PRODUCAO_TV_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> ProductionTVResponse:
    service = ProductionService(session)
    return ProductionTVResponse.model_validate(await service.tv(mode=mode, limit=limit, include_done=include_done))


@router.get("/ops/{op_id}/activity", response_model=list[ProductionActivityRead])
async def activity(
    op_id: UUID,
    limit: int = Query(100, ge=1, le=200),
    _: User = Depends(require_permission(KANBAN_PRODUCAO_HISTORY_VIEW)),
    session: AsyncSession = Depends(get_session),
) -> list[ProductionActivityRead]:
    service = ProductionService(session)
    rows = await service.activity(op_id, limit=limit)
    return [ProductionActivityRead.model_validate(row) for row in rows]
