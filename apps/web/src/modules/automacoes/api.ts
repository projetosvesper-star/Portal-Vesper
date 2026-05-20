import { apiRequest } from '../../shared/api/client';

export interface Approval {
  id: string;
  approval_id: string;
  correlation_id: string;
  approval_type: string;
  summary: string;
  risk_level: string;
  amount?: number;
  currency?: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

export interface WorkflowStatus {
  id: string;
  workflow_id: string;
  workflow_name: string;
  agent?: string;
  status: string;
  active: boolean;
  errors_last_24h: number;
}

export const getApprovals = async (status?: string) => {
  const url = status ? `/api/automation/approvals?status=${status}` : '/api/automation/approvals';
  return await apiRequest<Approval[]>(url);
};

export const respondApproval = async (approvalId: string, decision: 'approved' | 'rejected', reason: string) => {
  return await apiRequest<any>(`/api/automation/approvals/${approvalId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason })
  });
};

export const getWorkflowStatus = async () => {
  return await apiRequest<WorkflowStatus[]>('/api/ia/workflows/status');
};

export const callGateway = async (message: string, module_hint?: string, payload?: any) => {
  return await apiRequest<any>('/api/ia/gateway', {
    method: 'POST',
    body: JSON.stringify({ message, module_hint, payload })
  });
};
