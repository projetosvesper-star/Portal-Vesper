from typing import Any
import uuid

from fastapi import APIRouter, Depends, Query

from app.core.database import AsyncSessionLocal, get_session
from app.modules.automation.models import (
    AutomationEvent, AutomationAuditLog, AutomationError,
    AutomationDeadLetter, AutomationApproval, IaWorkflowStatus
)
from app.modules.automation.schemas import (
    AutomationEventCreate, AutomationEventRead, AutomationAuditCreate, AutomationAuditRead,
    AutomationErrorCreate, AutomationErrorRead, AutomationDeadLetterCreate, AutomationDeadLetterRead,
    AutomationApprovalCreate, AutomationApprovalRead, AutomationApprovalRespond,
    NotificationCreate, NotificationRead, WorkflowStatusRead,
    GatewayRequest, GatewayResponse, ApiResponse
)
from app.modules.automation.service import AutomationService
from app.modules.automation.security import verify_automation_request
from app.core.security import decode_access_token # Using proper auth logic from portal
from app.core.permissions import get_current_user

router = APIRouter(prefix="/api/automation", tags=["automation"])
ia_router = APIRouter(prefix="/api/ia", tags=["ia"])

def get_automation_service(session=Depends(get_session)) -> AutomationService:
    return AutomationService(session)

# --- Automation Incoming (Protected by API Key / HMAC) ---

@router.post("/events", response_model=ApiResponse, dependencies=[Depends(verify_automation_request)])
async def create_event(data: AutomationEventCreate, service: AutomationService = Depends(get_automation_service)):
    event = await service.create_event(data)
    return ApiResponse(
        success=True, correlation_id=event.correlation_id, request_id=event.request_id, status="recorded"
    )

@router.post("/audit", response_model=ApiResponse, dependencies=[Depends(verify_automation_request)])
async def create_audit(data: AutomationAuditCreate, service: AutomationService = Depends(get_automation_service)):
    audit = await service.create_audit(data)
    return ApiResponse(
        success=True, correlation_id=audit.correlation_id, request_id=audit.request_id, status="recorded"
    )

@router.post("/errors", response_model=ApiResponse, dependencies=[Depends(verify_automation_request)])
async def create_error(data: AutomationErrorCreate, service: AutomationService = Depends(get_automation_service)):
    err = await service.create_error(data)
    return ApiResponse(
        success=True, correlation_id=err.correlation_id, request_id=err.request_id, status="recorded"
    )

@router.post("/dead-letters", response_model=ApiResponse, dependencies=[Depends(verify_automation_request)])
async def create_dead_letter(data: AutomationDeadLetterCreate, service: AutomationService = Depends(get_automation_service)):
    dl = await service.create_dead_letter(data)
    return ApiResponse(
        success=True, correlation_id=dl.correlation_id, request_id=dl.request_id, status="recorded"
    )

@router.post("/approvals", response_model=ApiResponse, dependencies=[Depends(verify_automation_request)])
async def create_approval(data: AutomationApprovalCreate, service: AutomationService = Depends(get_automation_service)):
    appr = await service.create_approval(data)
    return ApiResponse(
        success=True, correlation_id=appr.correlation_id, request_id=appr.request_id, status="pending"
    )

# --- Frontend Portal API ---

@router.get("/approvals", response_model=list[AutomationApprovalRead])
async def list_approvals(
    status: str | None = None,
    risk_level: str | None = None,
    approval_type: str | None = None,
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    return await service.get_approvals(status, risk_level, approval_type)

@router.get("/approvals/{approval_id}", response_model=AutomationApprovalRead)
async def get_approval(
    approval_id: str,
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    return await service.get_approval(approval_id)

@router.post("/approvals/{approval_id}/respond", response_model=ApiResponse)
async def respond_approval(
    approval_id: str,
    data: AutomationApprovalRespond,
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    appr = await service.respond_approval(approval_id, data, user)
    return ApiResponse(
        success=True, correlation_id=appr.correlation_id, request_id=appr.request_id, status="responded", data={"decision": appr.decision}
    )

@router.get("/dead-letters", response_model=list[AutomationDeadLetterRead])
async def list_dead_letters(
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    return await service.get_dead_letters()

@router.post("/dead-letters/{id}/resolve", response_model=ApiResponse)
async def resolve_dead_letter(
    id: uuid.UUID,
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    dl = await service.resolve_dead_letter(id)
    return ApiResponse(
        success=True, correlation_id=dl.correlation_id, request_id=dl.request_id, status="resolved"
    )

@router.get("/auditoria/by-correlation/{correlation_id}")
async def get_timeline(
    correlation_id: str,
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    return await service.get_timeline(correlation_id)


# --- IA Endpoints ---

@ia_router.get("/workflows/status", response_model=list[WorkflowStatusRead])
async def get_workflows_status(
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    return await service.get_workflow_status()

@ia_router.post("/gateway", response_model=ApiResponse)
async def call_gateway(
    data: GatewayRequest,
    service: AutomationService = Depends(get_automation_service),
    user=Depends(get_current_user)
):
    resp = await service.call_gateway(data, user)
    return ApiResponse(
        success=resp.status != "failed",
        correlation_id=resp.correlation_id,
        request_id=resp.request_id,
        status=resp.status,
        data=resp.model_dump()
    )
