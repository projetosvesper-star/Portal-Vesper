from fastapi.testclient import TestClient

from app.main import app

def test_gateway_call_requires_auth():
    with TestClient(app) as client:
        payload = {
            "message": "Teste",
            "module_hint": "interno"
        }
        response = client.post("/api/ia/gateway", json=payload)
        assert response.status_code == 401

def test_automation_events_requires_auth():
    with TestClient(app) as client:
        payload = {
            "correlation_id": "corr-123",
            "request_id": "req-123",
            "source": "n8n",
            "event_type": "workflow_started",
            "status": "in_progress",
            "risk_level": "low",
            "payload": {"key": "value"}
        }
        response = client.post("/api/automation/events", json=payload)
        # Expected 403 Forbidden because no Bearer token provided
        assert response.status_code == 403
