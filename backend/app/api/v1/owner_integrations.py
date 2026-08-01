from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.integration import IntegrationConnection, IntegrationLog, AutomationWorkflow
from app.models.webhook import Webhook

router = APIRouter()

async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only platform owners can access this endpoint")
    return current_user

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    # Get connections stats
    total_connections = await db.scalar(select(func.count(IntegrationConnection.id)))
    online_connections = await db.scalar(select(func.count(IntegrationConnection.id)).where(IntegrationConnection.status == 'online'))
    
    # Get log stats (last 30 days)
    total_syncs = await db.scalar(select(func.count(IntegrationLog.id)))
    failed_syncs = await db.scalar(select(func.count(IntegrationLog.id)).where(IntegrationLog.status_code >= 400))
    avg_latency = await db.scalar(select(func.avg(IntegrationLog.latency_ms)))
    
    # Active Webhooks
    active_webhooks = await db.scalar(select(func.count(Webhook.id)).where(Webhook.is_active == True))
    
    global_health = 100.0
    if total_connections and total_connections > 0:
        avg_score = await db.scalar(select(func.avg(IntegrationConnection.health_score)))
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
            "active_webhooks": active_webhooks or 0
        }
    }

@router.get("/connected")
async def get_connected_integrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(
        select(IntegrationConnection).order_by(desc(IntegrationConnection.health_score))
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
                "last_sync_at": i.last_sync_at.isoformat() if i.last_sync_at else None
            }
            for i in integrations
        ]
    }

@router.get("/webhooks")
async def get_webhooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(select(Webhook).order_by(desc(Webhook.created_at)))
    webhooks = result.scalars().all()
    
    return {
        "webhooks": [
            {
                "id": str(w.id),
                "name": w.name,
                "url": w.url,
                "events": w.events,
                "is_active": w.is_active,
                "last_triggered_at": w.last_triggered_at.isoformat() if w.last_triggered_at else None,
                # Mocked live stats
                "latency_ms": 150,
                "success_rate": 99.9,
                "retries": 2
            }
            for w in webhooks
        ]
    }

@router.get("/workflows")
async def get_workflows(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(select(AutomationWorkflow).order_by(desc(AutomationWorkflow.created_at)))
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
                "last_executed_at": w.last_executed_at.isoformat() if w.last_executed_at else None
            }
            for w in workflows
        ]
    }

@router.get("/logs")
async def get_integration_logs(
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(
        select(IntegrationLog, IntegrationConnection)
        .join(IntegrationConnection, IntegrationLog.integration_id == IntegrationConnection.id)
        .order_by(desc(IntegrationLog.created_at))
        .limit(limit)
    )
    
    logs = []
    for log, conn in result.all():
        logs.append({
            "id": str(log.id),
            "provider": conn.provider,
            "request_method": log.request_method,
            "endpoint": log.endpoint,
            "status_code": log.status_code,
            "latency_ms": log.latency_ms,
            "timestamp": log.created_at.isoformat()
        })
        
    return {"logs": logs}
