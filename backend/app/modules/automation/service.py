import httpx
import uuid
from datetime import datetime, UTC
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.modules.automation.models import (
    AutomationEvent, AutomationAuditLog, AutomationError,
    AutomationDeadLetter, AutomationApproval, IaWorkflowStatus
)
from app.modules.automation.schemas import (
    AutomationEventCreate, AutomationAuditCreate, AutomationErrorCreate,
    AutomationDeadLetterCreate, AutomationApprovalCreate, AutomationApprovalRespond,
    GatewayRequest, GatewayResponse
)
from app.modules.automation.security import redact_sensitive_data

settings = get_settings()


class AutomationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_event(self, data: AutomationEventCreate) -> AutomationEvent:
        event = AutomationEvent(
            correlation_id=data.correlation_id,
            request_id=data.request_id,
            source=data.source,
            agent=data.agent,
            workflow=data.workflow,
            event_type=data.event_type,
            status=data.status,
            risk_level=data.risk_level,
            payload_json=data.payload
        )
        self.session.add(event)
        await self.session.commit()
        await self.session.refresh(event)
        return event

    async def create_audit(self, data: AutomationAuditCreate) -> AutomationAuditLog:
        audit = AutomationAuditLog(
            correlation_id=data.correlation_id,
            request_id=data.request_id,
            event_type=data.event_type,
            workflow=data.workflow,
            agent=data.agent,
            module=data.module,
            user_id=data.user_id,
            action=data.action,
            severity=data.severity,
            status=data.status,
            summary=data.summary,
            input_json=data.input_data,
            output_json=data.output_data
        )
        self.session.add(audit)
        await self.session.commit()
        await self.session.refresh(audit)
        return audit

    async def create_error(self, data: AutomationErrorCreate) -> AutomationError:
        error = AutomationError(
            correlation_id=data.correlation_id,
            request_id=data.request_id,
            source=data.source,
            workflow=data.workflow,
            agent=data.agent,
            module=data.module,
            failed_node=data.failed_node,
            severity=data.severity,
            retryable=data.retryable,
            retry_count=data.retry_count,
            status=data.status,
            error_message=data.error_message,
            redacted_payload_json=redact_sensitive_data(data.payload)
        )
        self.session.add(error)
        await self.session.commit()
        await self.session.refresh(error)
        return error

    async def create_dead_letter(self, data: AutomationDeadLetterCreate) -> AutomationDeadLetter:
        stmt = select(AutomationDeadLetter).where(AutomationDeadLetter.idempotency_key == data.idempotency_key)
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.occurrence_count += 1
            existing.last_seen_at = datetime.now(UTC)
            await self.session.commit()
            await self.session.refresh(existing)
            return existing

        dl = AutomationDeadLetter(
            idempotency_key=data.idempotency_key,
            correlation_id=data.correlation_id,
            request_id=data.request_id,
            workflow=data.workflow,
            agent=data.agent,
            module=data.module,
            failed_node=data.failed_node,
            severity=data.severity,
            retryable=data.retryable,
            retry_count=data.retry_count,
            status=data.status,
            error_message=data.error_message,
            redacted_payload_json=redact_sensitive_data(data.payload)
        )
        self.session.add(dl)
        await self.session.commit()
        await self.session.refresh(dl)
        return dl

    async def resolve_dead_letter(self, dl_id: uuid.UUID) -> AutomationDeadLetter:
        stmt = select(AutomationDeadLetter).where(AutomationDeadLetter.id == dl_id)
        result = await self.session.execute(stmt)
        dl = result.scalar_one_or_none()

        if not dl:
            raise HTTPException(status_code=404, detail="Dead letter not found")

        dl.status = "resolved"
        dl.resolved_at = datetime.now(UTC)
        await self.session.commit()
        await self.session.refresh(dl)
        return dl

    async def get_dead_letters(self) -> list[AutomationDeadLetter]:
        stmt = select(AutomationDeadLetter).order_by(AutomationDeadLetter.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_approval(self, data: AutomationApprovalCreate) -> AutomationApproval:
        expires_at = None
        if data.expires_in_seconds:
            expires_at = datetime.now(UTC) + datetime.timedelta(seconds=data.expires_in_seconds)

        approval = AutomationApproval(
            approval_id=data.approval_id,
            correlation_id=data.correlation_id,
            request_id=data.request_id,
            approval_type=data.approval_type,
            requested_by_json=data.requested_by,
            approver_json=data.approver,
            approver_role=data.approver_role,
            summary=data.summary,
            details_json=data.details,
            risk_level=data.risk_level,
            amount=data.amount,
            currency=data.currency,
            status=data.status,
            callback_json=data.callback,
            metadata_json=data.metadata_fields,
            expires_at=expires_at
        )
        self.session.add(approval)
        await self.session.commit()
        await self.session.refresh(approval)
        return approval

    async def get_approvals(self, status: str | None = None, risk_level: str | None = None, approval_type: str | None = None) -> list[AutomationApproval]:
        stmt = select(AutomationApproval)
        if status:
            stmt = stmt.where(AutomationApproval.status == status)
        if risk_level:
            stmt = stmt.where(AutomationApproval.risk_level == risk_level)
        if approval_type:
            stmt = stmt.where(AutomationApproval.approval_type == approval_type)
        stmt = stmt.order_by(AutomationApproval.created_at.desc())

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_approval(self, approval_id: str) -> AutomationApproval:
        stmt = select(AutomationApproval).where(AutomationApproval.approval_id == approval_id)
        result = await self.session.execute(stmt)
        approval = result.scalar_one_or_none()
        if not approval:
            raise HTTPException(status_code=404, detail="Approval not found")
        return approval

    async def respond_approval(self, approval_id: str, data: AutomationApprovalRespond, user: Any) -> AutomationApproval:
        approval = await self.get_approval(approval_id)

        if approval.status != "pending":
            raise HTTPException(status_code=400, detail="Approval is not pending")

        approval.status = "responded"
        approval.decision = data.decision
        approval.reason = data.reason
        approval.responded_at = datetime.now(UTC)
        approval.responded_by_json = {"id": str(user.id), "name": user.name, "email": user.email}

        # Handle callback if needed (mock for now or basic implementation)
        if approval.callback_json:
            # Here we would send the callback to n8n
            pass

        await self.session.commit()
        await self.session.refresh(approval)
        return approval

    async def get_timeline(self, correlation_id: str) -> dict[str, Any]:
        timeline = {}

        # Events
        stmt_e = select(AutomationEvent).where(AutomationEvent.correlation_id == correlation_id)
        timeline["events"] = list((await self.session.execute(stmt_e)).scalars().all())

        # Audit Logs
        stmt_a = select(AutomationAuditLog).where(AutomationAuditLog.correlation_id == correlation_id)
        timeline["audit_logs"] = list((await self.session.execute(stmt_a)).scalars().all())

        # Errors
        stmt_err = select(AutomationError).where(AutomationError.correlation_id == correlation_id)
        timeline["errors"] = list((await self.session.execute(stmt_err)).scalars().all())

        # Dead Letters
        stmt_dl = select(AutomationDeadLetter).where(AutomationDeadLetter.correlation_id == correlation_id)
        timeline["dead_letters"] = list((await self.session.execute(stmt_dl)).scalars().all())

        # Approvals
        stmt_app = select(AutomationApproval).where(AutomationApproval.correlation_id == correlation_id)
        timeline["approvals"] = list((await self.session.execute(stmt_app)).scalars().all())

        return timeline

    async def get_workflow_status(self) -> list[IaWorkflowStatus]:
        stmt = select(IaWorkflowStatus).order_by(IaWorkflowStatus.workflow_name)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # --- Gateway Supervisor ---

    async def call_gateway(self, data: GatewayRequest, user: Any) -> GatewayResponse:
        correlation_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())

        payload = {
            "correlation_id": correlation_id,
            "request_id": request_id,
            "runtime_mode": settings.N8N_RUNTIME_MODE,
            "source": "portal",
            "message": data.message,
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "department": user.department
            },
            "payload": data.payload or {},
            "module_hint": data.module_hint
        }

        # Audit log before
        await self.create_audit(AutomationAuditCreate(
            correlation_id=correlation_id,
            request_id=request_id,
            event_type="gateway_request",
            action="call_n8n_gateway",
            user_id=user.id,
            status="pending",
            input_data=payload
        ))

        url = f"{settings.N8N_BASE_URL}{settings.N8N_GATEWAY_WEBHOOK_PATH}"
        headers = {
            "Authorization": f"Bearer {settings.VESPER_PORTAL_API_KEY}",
            "X-Vesper-Correlation-Id": correlation_id,
            "X-Vesper-Request-Id": request_id,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers,
                    timeout=settings.N8N_REQUEST_TIMEOUT_SECONDS
                )
                response.raise_for_status()
                response_data = response.json()

                await self.create_audit(AutomationAuditCreate(
                    correlation_id=correlation_id,
                    request_id=request_id,
                    event_type="gateway_response",
                    action="n8n_gateway_success",
                    user_id=user.id,
                    status="success",
                    output_data=response_data
                ))

                return GatewayResponse(
                    correlation_id=response_data.get("correlation_id", correlation_id),
                    request_id=response_data.get("request_id", request_id),
                    status=response_data.get("status", "success"),
                    agent=response_data.get("agent"),
                    workflow=response_data.get("workflow"),
                    summary=response_data.get("summary"),
                    data=response_data.get("data"),
                    requires_approval=response_data.get("requires_approval", False),
                    approval_id=response_data.get("approval_id"),
                    risk_level=response_data.get("risk_level"),
                    next_action=response_data.get("next_action")
                )

        except Exception as e:
            # Audit log on error
            await self.create_error(AutomationErrorCreate(
                correlation_id=correlation_id,
                request_id=request_id,
                source="portal_gateway",
                status="failed",
                error_message=str(e),
                payload={"url": url}
            ))

            await self.create_audit(AutomationAuditCreate(
                correlation_id=correlation_id,
                request_id=request_id,
                event_type="gateway_response",
                action="n8n_gateway_failed",
                user_id=user.id,
                status="failed",
                severity="error",
                summary=str(e)
            ))

            # Simulate n8n offline or error gracefully
            return GatewayResponse(
                correlation_id=correlation_id,
                request_id=request_id,
                status="failed",
                summary="Gateway indisponível ou falha na integração.",
                data={"error": "N8N offline or error"}
            )
