"""Authenticated WebSocket manager."""

from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect, status
from jose import JWTError

from app.core.config import get_settings
from app.core.redis import WS_BROADCAST, WS_MODULE_CHANNEL, WS_USER_CHANNEL, get_redis_client
from app.core.security import decode_access_token


class WebSocketManager:
    def __init__(self) -> None:
        self.connections: dict[str, list[WebSocket]] = defaultdict(list)
        self.listener_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, user_id: str, subprotocol: str | None = None) -> None:
        await websocket.accept(subprotocol=subprotocol)
        self.connections[user_id].append(websocket)
        await self.send_to_websocket(
            websocket,
            {
                "type": "user.presence.updated",
                "payload": {"user_id": user_id, "status": "online"},
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )

    async def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id in self.connections and websocket in self.connections[user_id]:
            self.connections[user_id].remove(websocket)
        if user_id in self.connections and not self.connections[user_id]:
            del self.connections[user_id]
        await self.broadcast(
            {
                "type": "user.presence.updated",
                "payload": {"user_id": user_id, "status": "offline"},
                "timestamp": datetime.now(UTC).isoformat(),
            }
        )

    async def send_to_websocket(self, websocket: WebSocket, event: dict[str, Any]) -> None:
        await websocket.send_json(event)

    async def send_to_user(self, user_id: str, event: dict[str, Any]) -> None:
        for websocket in list(self.connections.get(user_id, [])):
            try:
                await websocket.send_json(event)
            except Exception:
                await self.disconnect(websocket, user_id)

    async def broadcast(self, event: dict[str, Any]) -> None:
        for user_id in list(self.connections.keys()):
            await self.send_to_user(user_id, event)

    async def start_redis_listener(self) -> None:
        if self.listener_task is not None:
            return
        self.listener_task = asyncio.create_task(self._listen_redis())

    async def _listen_redis(self) -> None:
        pubsub = get_redis_client().pubsub()
        await pubsub.subscribe(WS_BROADCAST)
        await pubsub.psubscribe(
            WS_USER_CHANNEL.format(user_id="*"),
            WS_MODULE_CHANNEL.format(module_key="*"),
        )
        async for message in pubsub.listen():
            message_type = message.get("type")
            if message_type not in {"message", "pmessage"}:
                continue
            event = json.loads(message["data"])
            channel = message.get("channel", "")
            if isinstance(channel, bytes):
                channel = channel.decode()
            if channel.startswith("ws:user:"):
                await self.send_to_user(channel.removeprefix("ws:user:"), event)
            elif channel.startswith("ws:module:"):
                await self.broadcast(event)
            else:
                await self.broadcast(event)

    async def disconnect_all(self) -> None:
        for user_id, sockets in list(self.connections.items()):
            for websocket in list(sockets):
                await self.disconnect(websocket, user_id)
        if self.listener_task:
            self.listener_task.cancel()
            self.listener_task = None


websocket_manager = WebSocketManager()


def _extract_subprotocols(websocket: WebSocket) -> list[str]:
    raw_protocols = websocket.headers.get("sec-websocket-protocol", "")
    return [protocol.strip() for protocol in raw_protocols.split(",") if protocol.strip()]


def _extract_websocket_token(websocket: WebSocket) -> tuple[str | None, str | None]:
    protocols = _extract_subprotocols(websocket)
    for protocol in protocols:
        if protocol.startswith("token."):
            return protocol.removeprefix("token."), "portal-vesper" if "portal-vesper" in protocols else None
    return websocket.query_params.get("token"), None


async def websocket_endpoint(websocket: WebSocket) -> None:
    token, response_subprotocol = _extract_websocket_token(websocket)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    settings = get_settings()
    try:
        payload = decode_access_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = str(payload["sub"])
    await websocket_manager.connect(websocket, user_id, response_subprotocol)
    try:
        while True:
            raw_message = await websocket.receive_text()
            if raw_message == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(UTC).isoformat()})
                continue
            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                continue
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(UTC).isoformat()})
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket, user_id)
