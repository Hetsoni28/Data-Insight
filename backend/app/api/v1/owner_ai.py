from typing import Any, List, Dict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.ai_ops import (
    AIProvider,
    AIModel,
    AIRoutingRule,
    AIPromptTemplate,
    AIUsageLog,
    ProviderStatus,
)

router = APIRouter()

def require_owner(current_user: User = Depends(get_current_user)):
    if getattr(current_user, 'role', '') != 'owner' and not getattr(current_user, 'is_owner', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/overview")
async def get_ai_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get high-level AI Ops KPIs for the dashboard."""
    
    # Provider KPIs
    providers_result = await db.execute(select(AIProvider))
    providers = providers_result.scalars().all()
    total_providers = len(providers)
    online_providers = sum(1 for p in providers if p.status == ProviderStatus.ONLINE)
    avg_health = sum(p.health_score for p in providers) / total_providers if total_providers else 100.0
    
    # Models
    models_count = await db.scalar(select(func.count(AIModel.id)).where(AIModel.is_active == True))
    
    # Usage / Cost KPIs (Last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Aggregate usage metrics
    usage_result = await db.execute(
        select(
            func.count(AIUsageLog.id),
            func.sum(AIUsageLog.tokens_total),
            func.sum(AIUsageLog.cost_usd),
            func.avg(AIUsageLog.latency_ms),
            func.sum(func.case((AIUsageLog.status_code != 200, 1), else_=0))
        ).where(AIUsageLog.created_at >= thirty_days_ago)
    )
    usage_stats = usage_result.fetchone()
    
    total_requests = int(usage_stats[0] or 0)
    total_tokens = int(usage_stats[1] or 0)
    total_cost = float(usage_stats[2] or 0.0)
    avg_latency = int(usage_stats[3] or 0)
    total_errors = int(usage_stats[4] or 0)
    
    error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0.0
    success_rate = 100.0 - error_rate
    
    return {
        "kpis": {
            "connected_providers": total_providers,
            "online_providers": online_providers,
            "available_models": models_count or 0,
            "avg_health_score": round(avg_health, 1),
            "monthly_requests": total_requests,
            "monthly_tokens": total_tokens,
            "monthly_cost_usd": round(total_cost, 2),
            "avg_cost_per_req": round(total_cost / total_requests, 4) if total_requests else 0,
            "avg_latency_ms": avg_latency,
            "success_rate": round(success_rate, 2),
        }
    }

@router.get("/providers")
async def get_providers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get all configured AI providers with their current status."""
    result = await db.execute(
        select(AIProvider).order_by(desc(AIProvider.health_score))
    )
    providers = result.scalars().all()
    
    return {
        "providers": [
            {
                "id": str(p.id),
                "name": p.name,
                "base_url": p.base_url,
                "status": p.status,
                "health_score": p.health_score,
                "latency_ms": p.latency_ms,
                "is_active": p.is_active,
                "environment": p.environment,
            }
            for p in providers
        ]
    }

@router.get("/models")
async def get_models(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get all AI models across all providers."""
    result = await db.execute(
        select(AIModel, AIProvider)
        .join(AIProvider, AIModel.provider_id == AIProvider.id)
        .order_by(AIProvider.name, AIModel.type)
    )
    
    models = []
    for model, provider in result.all():
        models.append({
            "id": str(model.id),
            "name": model.name,
            "provider": provider.name,
            "type": model.type,
            "context_window": model.context_window,
            "input_cost": float(model.input_cost_per_1k),
            "output_cost": float(model.output_cost_per_1k),
            "quality_score": model.quality_score,
            "is_active": model.is_active
        })
        
    return {"models": models}

@router.get("/routing")
async def get_routing_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get smart routing rules and fallbacks."""
    result = await db.execute(
        select(AIRoutingRule).order_by(asc(AIRoutingRule.task_type))
    )
    rules = result.scalars().all()
    
    # We need to fetch the model names to make the UI nice
    rule_data = []
    for r in rules:
        p_model = await db.get(AIModel, r.primary_model_id) if r.primary_model_id else None
        f_model = await db.get(AIModel, r.fallback_model_id) if r.fallback_model_id else None
        
        rule_data.append({
            "id": str(r.id),
            "task_type": r.task_type,
            "primary_model": p_model.name if p_model else "None",
            "fallback_model": f_model.name if f_model else "None",
            "timeout_ms": r.timeout_ms,
            "retry_count": r.retry_count,
            "is_active": r.is_active
        })
        
    return {"rules": rule_data}

@router.get("/usage/timeseries")
async def get_usage_timeseries(
    days: int = Query(7, le=30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get daily cost/request timeseries for charts."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Group by date
    # Note: Using native Postgres DATE_TRUNC or casting for simplicity
    query = (
        select(
            func.date_trunc('day', AIUsageLog.created_at).label('day'),
            func.count(AIUsageLog.id).label('requests'),
            func.sum(AIUsageLog.cost_usd).label('cost')
        )
        .where(AIUsageLog.created_at >= start_date)
        .group_by('day')
        .order_by('day')
    )
    
    result = await db.execute(query)
    
    timeseries = []
    for row in result.all():
        timeseries.append({
            "date": row.day.strftime("%Y-%m-%d"),
            "requests": int(row.requests),
            "cost": float(row.cost)
        })
        
    return {"timeseries": timeseries}
