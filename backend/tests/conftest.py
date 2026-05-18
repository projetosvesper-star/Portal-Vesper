import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://portal_vesper:test@localhost:5432/portal_vesper",
)
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("MINIO_ACCESS_KEY", "test-access")
os.environ.setdefault("MINIO_SECRET_KEY", "test-secret")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")
os.environ.setdefault("SKIP_STARTUP_CHECKS", "true")
