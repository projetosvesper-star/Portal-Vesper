"""Redis wrapper for cache, Pub/Sub and Streams."""

import json
from typing import Any

import redis.asyncio as redis

from app.core.config import get_settings

WS_BROADCAST = "ws:broadcast"
WS_USER_CHANNEL = "ws:user:{user_id}"
WS_MODULE_CHANNEL = "ws:module:{module_key}"

STREAM_AUDIT = "stream:audit"
STREAM_NOTIFICATIONS = "stream:notifications"
STREAM_MODULE_EVENTS = "stream:module_events"
STREAM_FILES = "stream:files"
STREAM_EMAIL = "stream:email"
STREAM_PDF = "stream:pdf"

_client: redis.Redis | None = None


def get_redis_client() -> redis.Redis:
    global _client
    if _client is None:
        settings = get_settings()
        _client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    return _client


async def get_redis() -> redis.Redis:
    return get_redis_client()


async def check_redis_connection() -> bool:
    try:
        await get_redis_client().ping()
        return True
    except Exception:
        return False


async def close_redis() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def publish(channel: str, event: dict[str, Any]) -> None:
    await get_redis_client().publish(channel, json.dumps(event, default=str))


async def publish_user(user_id: str, event: dict[str, Any]) -> None:
    await publish(WS_USER_CHANNEL.format(user_id=user_id), event)


async def publish_module(module_key: str, event: dict[str, Any]) -> None:
    await publish(WS_MODULE_CHANNEL.format(module_key=module_key), event)


async def add_stream_event(stream: str, event: dict[str, Any], max_len: int = 10000) -> str:
    data = {key: json.dumps(value, default=str) if isinstance(value, dict | list) else str(value) for key, value in event.items()}
    return await get_redis_client().xadd(stream, data, maxlen=max_len, approximate=True)
