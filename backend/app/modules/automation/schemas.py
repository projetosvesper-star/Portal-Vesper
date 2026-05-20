from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApiResponse(BaseModel):
    success: bool
    correlation_id: str | None = None
    request_id: str | None = None
    status: str
    data: dict[str, Any] | list | None = None
    error: dict[str, Any] | None = None


# --- Automation Events ---

class AutomationEventCreate(BaseModel):
    correlation_id: str
    request_id: str | None = None
    source: str
    agent: str | None = None
    workflow: str | None = None
    event_type: str
    status: str
    risk_level: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class AutomationEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    correlation_id: str
    request_id: str | None
    source: str
    agent: str | None
    workflow: str | None
    event_type: str
    status: str
    risk_level: str | None
    payload_json: dict[str, Any]
    created_at: datetime


# --- Audit Logs ---

class AutomationAuditCreate(BaseModel):
    correlation_id: str
    request_id: str | None = None
    event_type: str
    workflow: str | None = None
    agent: str | None = None
    module: str | None = None
    user_id: UUID | None = None
    action: str
    severity: str = "info"
    status: str
    summary: str | None = None
    input_data: dict[str, Any] | None = None
    output_data: dict[str, Any] | None = None


class AutomationAuditRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    correlation_id: str
    request_id: str | None
    event_type: str
    workflow: str | None
    agent: str | None
    module: str | None
    user_id: UUID | None
    action: str
    severity: str
    status: str
    summary: str | None
    input_json: dict[str, Any] | None
    output_json: dict[str, Any] | None
    created_at: datetime


# --- Errors ---

class AutomationErrorCreate(BaseModel):
    correlation_id: str
    request_id: str | None = None
    source: str
    workflow: str | None = None
    agent: str | None = None
    module: str | None = None
    failed_node: str | None = None
    severity: str = "error"
    retryable: bool = False
    retry_count: int = 0
    status: str
    error_message: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AutomationErrorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    correlation_id: str
    request_id: str | None
    source: str
    workflow: str | None
    agent: str | None
    module: str | None
    failed_node: str | None
    severity: str
    retryable: bool
    retry_count: int
    status: str
    error_message: str
    redacted_payload_json: dict[str, Any]
    created_at: datetime
    last_seen_at: datetime


# --- Dead Letters ---

class AutomationDeadLetterCreate(BaseModel):
    idempotency_key: str
    correlation_id: str
    request_id: str | None = None
    workflow: str | None = None
    agent: str | None = None
    module: str | None = None
    failed_node: str | None = None
    severity: str = "critical"
    retryable: bool = False
    retry_count: int = 0
    status: str = "open"
    error_message: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AutomationDeadLetterRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    idempotency_key: str
    correlation_id: str
    request_id: str | None
    workflow: str | None
    agent: str | None
    module: str | None
    failed_node: str | None
    severity: str
    retryable: bool
    retry_count: int
    status: str
    error_message: str
    redacted_payload_json: dict[str, Any]
    occurrence_count: int
    created_at: datetime
    last_seen_at: datetime
    resolved_at: datetime | None


# --- Approvals ---

class AutomationApprovalCreate(BaseModel):
    approval_id: str
    correlation_id: str
    request_id: str | None = None
    approval_type: str
    requested_by: dict[str, Any] | None = None
    approver: dict[str, Any] | None = None
    approver_role: str | None = None
    summary: str
    details: dict[str, Any] | None = None
    risk_level: str = "medium"
    amount: float | None = None
    currency: str | None = None
    status: str = "pending"
    callback: dict[str, Any] | None = None
    metadata_fields: dict[str, Any] | None = None
    expires_in_seconds: int | None = None


class AutomationApprovalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    approval_id: str
    correlation_id: str
    request_id: str | None
    approval_type: str
    requested_by_json: dict[str, Any] | None
    approver_json: dict[str, Any] | None
    approver_role: str | None
    summary: str
    details_json: dict[str, Any] | None
    risk_level: str
    amount: float | None
    currency: str | None
    status: str
    decision: str | None
    reason: str | None
    created_at: datetime
    expires_at: datetime | None
    responded_at: datetime | None
    responded_by_json: dict[str, Any] | None
    callback_json: dict[str, Any] | None
    metadata_json: dict[str, Any] | None


class AutomationApprovalRespond(BaseModel):
    decision: str
    reason: str


# --- Notifications ---

class NotificationCreate(BaseModel):
    user_id: UUID | None = None
    correlation_id: str | None = None
    request_id: str | None = None
    title: str
    message: str
    type: str = "info"
    target_department: str | None = None
    priority: str = "normal"
    channel: str = "in_app"
    status: str = "unread"
    payload: dict[str, Any] = Field(default_factory=dict)
    metadata_fields: dict[str, Any] = Field(default_factory=dict)


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    correlation_id: str | None
    request_id: str | None
    title: str
    message: str
    type: str
    target_department: str | None
    priority: str
    channel: str
    status: str
    read_at: datetime | None
    payload_json: dict[str, Any]
    metadata_json: dict[str, Any]
    created_at: datetime


# --- IA Workflows ---

class WorkflowStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: str
    workflow_name: str
    agent: str | None
    status: str
    active: bool
    last_execution_at: datetime | None
    last_success_at: datetime | None
    last_error_at: datetime | None
    success_rate: float | None
    errors_last_24h: int
    metadata_json: dict[str, Any]
    updated_at: datetime


# --- Gateway ---

class GatewayRequest(BaseModel):
    message: str
    module_hint: str | None = None
    payload: dict[str, Any] | None = None


class GatewayResponse(BaseModel):
    correlation_id: str
    request_id: str
    status: str
    agent: str | None = None
    workflow: str | None = None
    summary: str | None = None
    data: dict[str, Any] | None = None
    requires_approval: bool = False
    approval_id: str | None = None
    risk_level: str | None = None
    next_action: str | None = None
