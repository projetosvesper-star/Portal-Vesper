from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.permissions import get_current_user
from app.main import app
from app.models import PortalModule, User


def test_initial_module_keys_are_documented_in_seed():
    from seeds.initial_seed import MODULES

    keys = {module["key"] for module in MODULES}

    assert {"chat", "kanban", "propostas", "compras", "helpdesk", "controle_ti", "atalhos", "ia", "automacoes_n8n", "admin"} <= keys


class FakeScalarResult:
    def __init__(self, items):
        self.items = items

    def all(self):
        return self.items


class FakeExecuteResult:
    def __init__(self, items):
        self.items = items

    def scalars(self):
        return FakeScalarResult(self.items)

    def all(self):
        return self.items


class FakeModuleSession:
    async def execute(self, _statement):
        return FakeExecuteResult(
            [
                PortalModule(
                    id=uuid4(),
                    key="chat",
                    name="Chat Interno",
                    route="/chat",
                    icon="MessageCircle",
                    enabled=True,
                    order_index=10,
                    version="0.1.0",
                ),
                PortalModule(
                    id=uuid4(),
                    key="admin",
                    name="Administracao",
                    route="/admin",
                    icon="Shield",
                    enabled=True,
                    order_index=100,
                    version="0.1.0",
                ),
            ]
        )


def test_list_user_modules_for_superuser():
    user = User(
        id=uuid4(),
        username="Admin",
        name="Administrador",
        password_hash="hash",
        status="active",
        is_superuser=True,
    )

    async def override_user():
        return user

    async def override_session():
        yield FakeModuleSession()

    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as client:
            response = client.get("/api/me/modules")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert [module["key"] for module in response.json()] == ["chat", "admin"]
