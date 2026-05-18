from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.permissions import require_module_access, require_permission
from app.models import PortalModule, User


@pytest.mark.asyncio
async def test_superuser_bypasses_permission_dependency():
    dependency = require_permission("admin.users.view")
    user = User(
        id=uuid4(),
        username="Admin",
        name="Administrador",
        password_hash="hash",
        status="active",
        is_superuser=True,
    )

    result = await dependency(current_user=user, session=None)

    assert result is user


class FakeForbiddenModuleSession:
    async def scalar(self, _statement):
        return PortalModule(
            id=uuid4(),
            key="kanban",
            name="Kanban",
            route="/kanban",
            icon="KanbanSquare",
            enabled=True,
            order_index=20,
            version="0.1.0",
        )

    async def execute(self, _statement):
        class EmptyResult:
            def all(self):
                return []

        return EmptyResult()


@pytest.mark.asyncio
async def test_module_access_without_permission_is_blocked():
    dependency = require_module_access("kanban")
    user = User(
        id=uuid4(),
        username="user",
        name="Usuario",
        password_hash="hash",
        status="active",
        is_superuser=False,
    )

    with pytest.raises(HTTPException) as exc:
        await dependency(current_user=user, session=FakeForbiddenModuleSession())

    assert exc.value.status_code == 403
