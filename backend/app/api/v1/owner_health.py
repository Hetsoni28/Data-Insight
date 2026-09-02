import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from app.api.deps import get_current_user
from app.db.redis import get_redis_client
from app.db.session import engine
from app.models.user import User

router = APIRouter()


async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, "role", "") != "owner" and not getattr(
        current_user, "is_owner", False,
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


@router.get("", summary="Get Platform Health")
async def get_platform_health(
    _: User = Depends(require_owner),
):
    """Returns live health metrics for the platform infrastructure."""
    request_start = time.perf_counter()
    from app.core.config import settings
    from app.services.ai.router import LLMRouter
    from app.core.websockets import manager as ws_manager

    # 1. Database Ping — fresh engine connection avoids stale session state
    db_start = time.perf_counter()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "operational"
    except Exception:
        db_status = "down"
    db_latency = int((time.perf_counter() - db_start) * 1000)

    # 2. Real Redis Ping
    redis_start = time.perf_counter()
    workers_value = "Unknown"
    try:
        redis = await get_redis_client()
        await redis.ping()
        redis_status = "operational"
        try:
            # Check celery queue size roughly
            queue_len = await redis.llen("celery")
            workers_value = f"{queue_len} in queue"
        except Exception:
            workers_value = "operational"
    except Exception:
        redis_status = "down"
        workers_value = "unreachable"
    redis_latency = int((time.perf_counter() - redis_start) * 1000)

    # 3. AI Providers (Check configuration)
    llm = LLMRouter()
    groq_up = llm.groq_provider.is_available()
    gemini_up = llm.gemini_provider.is_available()
    if groq_up or gemini_up:
        ai_status = "operational"
        ai_val = "Groq & Gemini" if groq_up and gemini_up else ("Groq" if groq_up else "Gemini")
    else:
        ai_status = "down"
        ai_val = "Not Configured"

    # 4. Email Service (Check configuration)
    email_status = "operational" if settings.SMTP_USER and settings.SMTP_PASSWORD else "degraded"
    email_val = "Configured" if email_status == "operational" else "Not Configured"

    # 5. WebSockets
    active_ws = sum(len(conns) for conns in ws_manager.active_connections.values())
    ws_val = f"{active_ws} connected"

    # 6. Core API
    api_latency = int((time.perf_counter() - request_start) * 1000) + 1

    return {
        "status": "success",
        "data": [
            {
                "id": "api",
                "name": "Core API",
                "status": "operational",
                "value": f"{api_latency}ms",
            },
            {
                "id": "db",
                "name": "Database (Primary)",
                "status": db_status,
                "value": f"{max(1, db_latency)}ms",
            },
            {
                "id": "redis",
                "name": "Redis Cache",
                "status": redis_status,
                "value": f"{max(1, redis_latency)}ms",
            },
            {
                "id": "ai",
                "name": "AI Providers",
                "status": ai_status,
                "value": ai_val,
            },
            {
                "id": "email",
                "name": "Email Service",
                "status": email_status,
                "value": email_val,
            },
            {
                "id": "jobs",
                "name": "Background Workers",
                "status": redis_status,
                "value": workers_value,
            },
            {
                "id": "ws",
                "name": "WebSockets",
                "status": "operational",
                "value": ws_val,
            },
        ],
    }
