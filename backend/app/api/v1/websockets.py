from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from typing import Optional
from loguru import logger
from jose import jwt, JWTError

from app.core.config import settings
from app.core.websockets import manager
from app.db.session import AsyncSessionLocal
from app.repositories.user import UserRepository

router = APIRouter()


async def get_user_from_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str | None = payload.get("sub")
        if not user_id:
            return None

        async with AsyncSessionLocal() as session:
            user_repo = UserRepository(session)
            user = await user_repo.get_by_id(user_id)
            if user and user.is_active:
                return user
    except Exception as e:
        logger.error(f"WebSocket auth failed: {e}")
    return None


@router.websocket("/ws/tenant-events")
async def websocket_tenant_events(
    websocket: WebSocket, token: Optional[str] = Query(None)
):
    logger.info(f"Incoming WebSocket connection attempt. Token present: {bool(token)}")
    if not token:
        logger.warning("WebSocket rejected: Missing token")
        await websocket.close(code=4001, reason="Missing token")
        return

    user = await get_user_from_token(token)
    if not user or not user.tenant_id:
        await websocket.close(code=4001, reason="Unauthorized or no tenant")
        return

    tenant_id = str(user.tenant_id)
    await manager.connect(websocket, tenant_id)

    try:
        while True:
            # We don't expect to receive messages from the client yet,
            # but we need to keep the connection open and read to detect disconnects
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, tenant_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, tenant_id)
