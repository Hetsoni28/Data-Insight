import asyncio
import json
from fastapi import WebSocket
from typing import Dict, Set
from loguru import logger
from app.db.redis import get_redis_client
from redis.asyncio.client import PubSub

class WebSocketManager:
    def __init__(self):
        # tenant_id -> set of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.pubsub: PubSub | None = None
        self.listener_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = set()
        self.active_connections[tenant_id].add(websocket)
        logger.debug(f"WebSocket connected for tenant {tenant_id}. Total: {len(self.active_connections[tenant_id])}")

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        if tenant_id in self.active_connections:
            self.active_connections[tenant_id].discard(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]
        logger.debug(f"WebSocket disconnected for tenant {tenant_id}.")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        """Broadcast directly to connected clients for a tenant (local in-memory)."""
        if tenant_id in self.active_connections:
            # Create a list of connections to avoid RuntimeError: Set changed size during iteration
            for connection in list(self.active_connections[tenant_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to websocket: {e}")
                    self.disconnect(connection, tenant_id)

    async def publish_tenant_event(self, tenant_id: str, event_type: str, payload: dict = None):
        """Publish event to Redis so all workers/instances can broadcast it."""
        redis = await get_redis_client()
        message = {
            "tenant_id": str(tenant_id),
            "type": event_type,
            "payload": payload or {}
        }
        await redis.publish("tenant_events", json.dumps(message))

    async def listen_for_messages(self):
        """Background task that listens to Redis PubSub and broadcasts to local websockets."""
        redis = await get_redis_client()
        self.pubsub = redis.pubsub()
        await self.pubsub.subscribe("tenant_events")
        
        logger.info("[WebSocketManager] Listening for tenant_events on Redis Pub/Sub")
        
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        tenant_id = data.get("tenant_id")
                        if tenant_id:
                            await self.broadcast_to_tenant(tenant_id, data)
                    except json.JSONDecodeError:
                        logger.error("Failed to decode Redis pubsub message")
                    except Exception as e:
                        logger.error(f"Error handling pubsub message: {e}")
        except asyncio.CancelledError:
            logger.info("[WebSocketManager] Pub/Sub listener cancelled")
            if self.pubsub:
                await self.pubsub.unsubscribe("tenant_events")

    async def start_listener(self):
        self.listener_task = asyncio.create_task(self.listen_for_messages())

    async def stop_listener(self):
        if self.listener_task:
            self.listener_task.cancel()
            try:
                await self.listener_task
            except asyncio.CancelledError:
                pass

manager = WebSocketManager()
