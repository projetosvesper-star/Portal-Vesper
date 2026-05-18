from datetime import UTC, datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.permissions import get_current_user
from app.main import app
from app.models import User
from app.modules.files import router as files_router


class FakeFileSession:
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            obj.id = obj.id or uuid4()
            obj.created_at = datetime.now(UTC)


def test_upload_file_uses_storage_service(monkeypatch):
    user = User(
        id=uuid4(),
        username="Admin",
        name="Administrador",
        password_hash="hash",
        status="active",
        is_superuser=True,
    )

    def fake_upload_file(content, original_name, content_type, bucket, prefix=None):
        return {
            "bucket": bucket,
            "object_key": f"{prefix or 'root'}/{original_name}",
            "size_bytes": len(content),
            "checksum": "checksum",
        }

    async def fake_stream(*_args, **_kwargs):
        return "1-0"

    async def override_user():
        return user

    async def override_session():
        yield FakeFileSession()

    monkeypatch.setattr(files_router.storage_service, "upload_file", fake_upload_file)
    monkeypatch.setattr(files_router, "add_stream_event", fake_stream)
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/files/upload",
                files={"upload": ("teste.txt", b"conteudo", "text/plain")},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["original_name"] == "teste.txt"
