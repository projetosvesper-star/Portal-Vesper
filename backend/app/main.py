"""Portal Vesper FastAPI application."""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import check_database_connection
from app.core.redis import check_redis_connection, close_redis
from app.core.storage import storage_service
from app.core.websocket import websocket_endpoint, websocket_manager
from app.modules.admin.router import router as admin_router
from app.modules.auth.router import router as auth_router
from app.modules.files.router import router as files_router
from app.modules.kanban.router import router as kanban_router
from app.modules.notifications.router import router as notifications_router
from app.modules.portal.router import router as portal_router

settings = get_settings()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.SKIP_STARTUP_CHECKS:
        logger.info("portal.startup.skipped_checks")
        yield
        await websocket_manager.disconnect_all()
        await close_redis()
        return

    db_ok = await check_database_connection()
    redis_ok = await check_redis_connection()
    if redis_ok:
        await websocket_manager.start_redis_listener()
    try:
        storage_service.ensure_buckets()
        storage_ok = True
    except Exception:
        storage_ok = False
    logger.info("portal.startup", database=db_ok, redis=redis_ok, storage=storage_ok)
    yield
    await websocket_manager.disconnect_all()
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Portal empresarial modular Vesper",
    lifespan=lifespan,
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("portal.unhandled_exception", error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})


@app.get("/api/health", tags=["Health"])
async def health_check() -> dict:
    if settings.SKIP_STARTUP_CHECKS:
        return {
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "dependencies": {"database": "skipped", "redis": "skipped", "storage": "skipped"},
        }

    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "dependencies": {
            "database": await check_database_connection(),
            "redis": await check_redis_connection(),
            "storage": storage_service.check_connection(),
        },
    }


app.include_router(auth_router, prefix="/api")
app.include_router(portal_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(kanban_router, prefix="/api")
app.add_api_websocket_route("/ws", websocket_endpoint)
