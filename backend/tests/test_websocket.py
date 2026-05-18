from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import create_access_token
from app.main import app


def test_websocket_authenticates_and_responds_to_ping():
    settings = get_settings()
    token = create_access_token(
        "00000000-0000-0000-0000-000000000001",
        "Admin",
        settings.JWT_SECRET_KEY,
        settings.JWT_ALGORITHM,
        5,
    )

    with TestClient(app) as client:
        with client.websocket_connect("/ws", subprotocols=["portal-vesper", f"token.{token}"]) as websocket:
            connected = websocket.receive_json()
            websocket.send_json({"type": "ping"})
            pong = websocket.receive_json()

    assert connected["type"] == "user.presence.updated"
    assert pong["type"] == "pong"
