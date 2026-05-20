"""Central application settings for Portal Vesper."""

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "Portal Vesper"
    VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    LOG_LEVEL: str = "INFO"
    SKIP_STARTUP_CHECKS: bool = False

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = Field(
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Em desenvolvimento, é comum o Vite rodar em localhost ou 127.0.0.1 (origens diferentes).
    # Mantemos defaults seguros, e bloqueamos '*' em produção via validator.
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:5175,http://127.0.0.1:5175,"
        "http://localhost:5176,http://127.0.0.1:5176,"
        "http://localhost:5177,http://127.0.0.1:5177,"
        "http://localhost:1420,tauri://localhost"
    )
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_UPLOAD_CONTENT_TYPES: str = (
        "application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv,"
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_SECURE: bool = False
    MINIO_BUCKET_DEFAULT: str = "portal-files"

    API_BASE_URL: str = "http://localhost:8000"
    WEB_BASE_URL: str = "http://localhost:5173"

    # Automation Core (n8n Integration)
    N8N_BASE_URL: str = "http://127.0.0.1:5678"
    N8N_GATEWAY_WEBHOOK_PATH: str = "/webhook/vesper/core/gateway"
    N8N_REQUEST_TIMEOUT_SECONDS: int = 60
    N8N_RUNTIME_MODE: str = "PORTAL"
    VESPER_PORTAL_API_KEY: str = "dev_portal_key_123"
    N8N_HMAC_SECRET: str = ""
    N8N_REQUIRE_HMAC: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_upload_content_types_set(self) -> set[str]:
        return {
            content_type.strip()
            for content_type in self.ALLOWED_UPLOAD_CONTENT_TYPES.split(",")
            if content_type.strip()
        }

    @model_validator(mode="after")
    def validate_security_defaults(self) -> "Settings":
        if self.is_production and "*" in self.cors_origins_list:
            raise ValueError("CORS_ORIGINS cannot contain '*' in production")
        if self.is_production and len(self.JWT_SECRET_KEY) < 32:
            raise ValueError("JWT_SECRET_KEY must have at least 32 characters in production")
        return self

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
