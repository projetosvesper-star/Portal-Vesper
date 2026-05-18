from uuid import uuid4

import pytest

from app.modules.notifications import service


class FakeNotificationSession:
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        return None


@pytest.mark.asyncio
async def test_create_notification_persists_and_emits(monkeypatch):
    emitted = []

    async def fake_stream(stream, event):
        emitted.append(("stream", stream, event))
        return "1-0"

    async def fake_publish(user_id, event):
        emitted.append(("publish", user_id, event))

    monkeypatch.setattr(service, "add_stream_event", fake_stream)
    monkeypatch.setattr(service, "publish_user", fake_publish)

    session = FakeNotificationSession()
    user_id = uuid4()
    notification = await service.create_notification(
        session,
        user_id=user_id,
        title="Teste",
        message="Mensagem",
    )

    assert notification in session.added
    assert notification.user_id == user_id
    assert any(item[0] == "stream" for item in emitted)
    assert any(item[0] == "publish" for item in emitted)
