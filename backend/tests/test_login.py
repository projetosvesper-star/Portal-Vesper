from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security import create_refresh_token, hash_password
from app.main import app
from app.models import RefreshToken, User


class FakeSession:
    def __init__(self, user: User, scalar_results: list | None = None):
        self.user = user
        self.scalar_results = scalar_results or [user]
        self.added = []

    async def scalar(self, _statement):
        return self.scalar_results.pop(0)

    def add(self, _obj):
        self.added.append(_obj)

    async def get(self, _model, _id):
        return self.user

    async def flush(self):
        return None


def test_login_with_username_and_password():
    user = User(
        id=uuid4(),
        username="Admin",
        name="Administrador",
        password_hash=hash_password("Vesper@890"),
        status="active",
        is_superuser=True,
    )
    fake_session = FakeSession(user)

    async def override_session():
        yield fake_session

    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/auth/login",
                json={"username": "Admin", "password": "Vesper@890", "remember_me": True},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["username"] == "Admin"
    assert body["access_token"]
    assert body["refresh_token"]


def test_refresh_token_rotates_token_pair():
    user = User(
        id=uuid4(),
        username="Admin",
        name="Administrador",
        password_hash=hash_password("Vesper@890"),
        status="active",
        is_superuser=True,
    )
    raw_refresh, refresh_hash = create_refresh_token()
    refresh_token = RefreshToken(
        id=uuid4(),
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    fake_session = FakeSession(user, [refresh_token, user])

    async def override_session():
        yield fake_session

    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            response = client.post("/api/auth/refresh", json={"refresh_token": raw_refresh})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert refresh_token.revoked_at is not None


def test_invalid_token_is_rejected():
    with TestClient(app) as client:
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})

    assert response.status_code == 401
