from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.integration import (
    AutomationWorkflow,
    IntegrationConnection,
    IntegrationLog,
)
from app.models.user import User
from app.models.webhook import Webhook
from app.models.webhook_delivery import WebhookDeliveryLog

router = APIRouter()


async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if not getattr(current_user, "is_owner", False) and current_user.role != "owner":
        raise HTTPException(
            status_code=403, detail="Only platform owners can access this endpoint",
        )
    return current_user


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    # Get connections stats
    total_connections = await db.scalar(select(func.count(IntegrationConnection.id)))
    online_connections = await db.scalar(
        select(func.count(IntegrationConnection.id)).where(
            IntegrationConnection.status == "online",
        ),
    )

    # Get log stats (last 30 days)
    total_syncs = await db.scalar(select(func.count(IntegrationLog.id)))
    failed_syncs = await db.scalar(
        select(func.count(IntegrationLog.id)).where(IntegrationLog.status_code >= 400),
    )
    avg_latency = await db.scalar(select(func.avg(IntegrationLog.latency_ms)))

    # Active Webhooks
    active_webhooks = await db.scalar(
        select(func.count(Webhook.id)).where(Webhook.is_active == True),
    )

    global_health = 100.0
    if total_connections and total_connections > 0:
        avg_score = await db.scalar(
            select(func.avg(IntegrationConnection.health_score)),
        )
        global_health = float(avg_score or 100.0)

    return {
        "kpis": {
            "total_connections": total_connections or 0,
            "online_connections": online_connections or 0,
            "offline_connections": (total_connections or 0) - (online_connections or 0),
            "global_health_score": round(global_health, 1),
            "total_syncs_30d": total_syncs or 0,
            "failed_syncs_30d": failed_syncs or 0,
            "avg_latency_ms": int(avg_latency or 0),
            "active_webhooks": active_webhooks or 0,
        },
    }


@router.get("/connected")
async def get_connected_integrations(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    result = await db.execute(
        select(IntegrationConnection).order_by(desc(IntegrationConnection.health_score)),
    )
    integrations = result.scalars().all()

    return {
        "integrations": [
            {
                "id": str(i.id),
                "name": i.name,
                "provider": i.provider,
                "category": i.category,
                "status": i.status,
                "health_score": i.health_score,
                "auth_type": i.auth_type,
                "latency_ms": i.latency_ms,
                "error_rate": i.error_rate,
                "is_active": i.is_active,
                "last_sync_at": i.last_sync_at.isoformat() if i.last_sync_at else None,
            }
            for i in integrations
        ],
    }


@router.get("/webhooks")
async def get_webhooks(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    # Subquery to calculate real stats from delivery logs
    stats_subq = (
        select(
            WebhookDeliveryLog.webhook_id,
            func.avg(WebhookDeliveryLog.latency_ms).label("avg_latency"),
            func.sum(WebhookDeliveryLog.retry_count).label("total_retries"),
            func.count(WebhookDeliveryLog.id).label("total_deliveries"),
            func.sum(case((WebhookDeliveryLog.success == True, 1), else_=0)).label(
                "success_count",
            ),
        )
        .group_by(WebhookDeliveryLog.webhook_id)
        .subquery()
    )

    query = (
        select(Webhook, stats_subq)
        .outerjoin(stats_subq, Webhook.id == stats_subq.c.webhook_id)
        .order_by(desc(Webhook.created_at))
    )

    result = await db.execute(query)

    webhooks_data = []
    for row in result.all():
        w = row.Webhook
        avg_latency = float(row.avg_latency or 0)
        total_retries = int(row.total_retries or 0)
        total_deliveries = int(row.total_deliveries or 0)
        success_count = int(row.success_count or 0)

        success_rate = (
            (success_count / total_deliveries * 100) if total_deliveries > 0 else 100.0
        )

        webhooks_data.append(
            {
                "id": str(w.id),
                "name": w.name,
                "url": w.url,
                "events": w.events,
                "is_active": w.is_active,
                "last_triggered_at": (
                    w.last_triggered_at.isoformat() if w.last_triggered_at else None
                ),
                "latency_ms": int(avg_latency),
                "success_rate": round(success_rate, 1),
                "retries": total_retries,
            },
        )

    return {"webhooks": webhooks_data}


@router.get("/workflows")
async def get_workflows(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    result = await db.execute(
        select(AutomationWorkflow).order_by(desc(AutomationWorkflow.created_at)),
    )
    workflows = result.scalars().all()

    return {
        "workflows": [
            {
                "id": str(w.id),
                "name": w.name,
                "description": w.description,
                "trigger_type": w.trigger_type,
                "trigger_config": w.trigger_config,
                "actions": w.actions,
                "status": w.status,
                "success_rate": w.success_rate,
                "execution_count": w.execution_count,
                "is_active": w.is_active,
                "last_executed_at": (
                    w.last_executed_at.isoformat() if w.last_executed_at else None
                ),
            }
            for w in workflows
        ],
    }


@router.get("/logs")
async def get_integration_logs(
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
) -> Any:
    result = await db.execute(
        select(IntegrationLog, IntegrationConnection)
        .join(
            IntegrationConnection,
            IntegrationLog.integration_id == IntegrationConnection.id,
        )
        .order_by(desc(IntegrationLog.created_at))
        .limit(limit),
    )

    logs = []
    for log, conn in result.all():
        logs.append(
            {
                "id": str(log.id),
                "provider": conn.provider,
                "request_method": log.request_method,
                "endpoint": log.endpoint,
                "status_code": log.status_code,
                "latency_ms": log.latency_ms,
                "timestamp": log.created_at.isoformat(),
            },
        )

    return {"logs": logs}
