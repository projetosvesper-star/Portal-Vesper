import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base


class AutomationEvent(Base):
    __tablename__ = "automation_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    agent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    workflow: Mapped[str | None] = mapped_column(String(200), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    risk_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payload_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class AutomationAuditLog(Base):
    __tablename__ = "automation_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    workflow: Mapped[str | None] = mapped_column(String(200), nullable=True)
    agent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    module: Mapped[str | None] = mapped_column(String(100), nullable=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(String(200), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="info", nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    input_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class AutomationError(Base):
    __tablename__ = "automation_errors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    workflow: Mapped[str | None] = mapped_column(String(200), nullable=True)
    agent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    module: Mapped[str | None] = mapped_column(String(100), nullable=True)
    failed_node: Mapped[str | None] = mapped_column(String(200), nullable=True)
    severity: Mapped[str] = mapped_column(String(50), default="error", nullable=False)
    retryable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    redacted_payload_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AutomationDeadLetter(Base):
    __tablename__ = "automation_dead_letters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idempotency_key: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    workflow: Mapped[str | None] = mapped_column(String(200), nullable=True)
    agent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    module: Mapped[str | None] = mapped_column(String(100), nullable=True)
    failed_node: Mapped[str | None] = mapped_column(String(200), nullable=True)
    severity: Mapped[str] = mapped_column(String(50), default="critical", nullable=False)
    retryable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    redacted_payload_json: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AutomationApproval(Base):
    __tablename__ = "automation_approvals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    approval_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    approval_type: Mapped[str] = mapped_column(String(100), nullable=False)
    requested_by_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    approver_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    approver_role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    details_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    decision: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responded_by_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    callback_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class IaWorkflowStatus(Base):
    __tablename__ = "ia_workflow_status"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    workflow_name: Mapped[str] = mapped_column(String(200), nullable=False)
    agent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_execution_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    success_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    errors_last_24h: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
