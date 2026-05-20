import copy
import hashlib
import hmac
from typing import Any
from fastapi import Request, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import get_settings

settings = get_settings()
security = HTTPBearer()

def redact_sensitive_data(payload: Any) -> Any:
    """Recursively masca keys that may contain sensitive data."""
    if isinstance(payload, dict):
        redacted = copy.deepcopy(payload)
        sensitive_keys = {
            "password", "senha", "token", "api_key", "secret", "authorization",
            "cookie", "jwt", "bearer", "access_token", "refresh_token",
            "private_key", "client_secret"
        }
        for key, value in redacted.items():
            if str(key).lower() in sensitive_keys:
                redacted[key] = "***REDACTED***"
            elif isinstance(value, (dict, list)):
                redacted[key] = redact_sensitive_data(value)
        return redacted
    elif isinstance(payload, list):
        return [redact_sensitive_data(item) for item in payload]
    return payload


async def verify_automation_request(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security),
):
    """
    Dependency to verify requests coming from n8n or internal automation.
    1. Validate Bearer Token against VESPER_PORTAL_API_KEY.
    2. Validate HMAC signature if N8N_REQUIRE_HMAC is true.
    """
    if credentials.credentials != settings.VESPER_PORTAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid automation API key",
        )

    if settings.N8N_REQUIRE_HMAC:
        signature = request.headers.get("x-vesper-signature")
        timestamp = request.headers.get("x-vesper-timestamp")

        if not signature or not timestamp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing HMAC signature or timestamp",
            )

        body = await request.body()
        message = timestamp.encode("utf-8") + b"." + body

        expected_signature = hmac.new(
            settings.N8N_HMAC_SECRET.encode("utf-8"),
            message,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid HMAC signature",
            )
    return True
