from fastapi.testclient import TestClient

from app.main import app


def test_health_check_returns_base_payload():
    with TestClient(app) as client:
        response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["app"] == "Portal Vesper"
    assert "dependencies" in body
