import uuid
from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, true, false
from datetime import datetime, timezone, timedelta

from app.api.deps import get_current_superuser
from app.db.session import get_async_session
from app.models.ai_token_usage import AITokenUsage
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter()

def get_provider_from_model(model_name: str) -> str:
    """Helper to classify model string into provider."""
    model_name = model_name.lower()
    if "gpt" in model_name or "text-embedding" in model_name:
        return "OpenAI"
    elif "claude" in model_name:
        return "Anthropic"
    elif "gemini" in model_name:
        return "Google Vertex AI"
    elif "llama" in model_name or "mistral" in model_name or "qwen" in model_name or "deepseek" in model_name:
        return "Azure AI Studio" # Group open source models here as mock Azure/Bedrock deployment
    return "Other / Local"


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser)
) -> Any:
    """High-level AI Usage overview."""
    now = datetime.now(timezone.utc)
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total requests
    total_requests = await db.scalar(select(func.count(AITokenUsage.id))) or 0
    monthly_requests = await db.scalar(select(func.count(AITokenUsage.id)).where(AITokenUsage.created_at >= first_day_of_month)) or 0
    
    # Token stats
    total_tokens = await db.scalar(select(func.sum(AITokenUsage.total_tokens))) or 0
    prompt_tokens = await db.scalar(select(func.sum(AITokenUsage.prompt_tokens))) or 0
    completion_tokens = await db.scalar(select(func.sum(AITokenUsage.completion_tokens))) or 0
    
    # Cost
    total_cost = await db.scalar(select(func.sum(AITokenUsage.cost_usd))) or 0.0
    monthly_cost = await db.scalar(select(func.sum(AITokenUsage.cost_usd)).where(AITokenUsage.created_at >= first_day_of_month)) or 0.0
    
    # Latency & Success rate
    avg_latency = await db.scalar(select(func.avg(AITokenUsage.latency_ms))) or 0.0
    failed_requests = await db.scalar(select(func.count(AITokenUsage.id)).where(AITokenUsage.status_code >= 400)) or 0
    
    success_rate = 100.0
    if total_requests > 0:
        success_rate = ((total_requests - failed_requests) / total_requests) * 100
        
    # Active organizations
    active_orgs = await db.scalar(select(func.count(func.distinct(AITokenUsage.tenant_id)))) or 0

    return {
        "total_requests": total_requests,
        "monthly_requests": monthly_requests,
        "total_tokens": total_tokens,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_cost": float(total_cost),
        "monthly_cost": float(monthly_cost),
        "avg_latency": float(avg_latency),
        "failed_requests": failed_requests,
        "success_rate": success_rate,
        "active_organizations": active_orgs,
        "average_cost_per_request": (float(total_cost) / total_requests) if total_requests else 0,
        "average_tokens_per_request": (total_tokens / total_requests) if total_requests else 0,
    }


@router.get("/providers")
async def get_providers(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser)
) -> Any:
    """Group analytics by AI provider."""
    records = (await db.execute(
        select(
            AITokenUsage.model,
            func.count(AITokenUsage.id).label("requests"),
            func.sum(AITokenUsage.total_tokens).label("tokens"),
            func.sum(AITokenUsage.cost_usd).label("cost"),
            func.avg(AITokenUsage.latency_ms).label("latency")
        ).group_by(AITokenUsage.model)
    )).all()
    
    providers = {}
    for r in records:
        provider = get_provider_from_model(r.model)
        if provider not in providers:
            providers[provider] = {"name": provider, "requests": 0, "tokens": 0, "cost": 0.0, "latency_sum": 0.0}
            
        providers[provider]["requests"] += r.requests
        providers[provider]["tokens"] += r.tokens
        providers[provider]["cost"] += float(r.cost or 0)
        providers[provider]["latency_sum"] += (float(r.latency or 0) * r.requests)
        
    result = []
    for p in providers.values():
        req = p["requests"]
        p["avg_latency"] = p["latency_sum"] / req if req else 0
        del p["latency_sum"]
        result.append(p)
        
    return {"data": sorted(result, key=lambda x: x["requests"], reverse=True)}


@router.get("/models")
async def get_models(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser)
) -> Any:
    """Analytics by exact model."""
    records = (await db.execute(
        select(
            AITokenUsage.model,
            func.count(AITokenUsage.id).label("requests"),
            func.sum(AITokenUsage.total_tokens).label("tokens"),
            func.sum(AITokenUsage.cost_usd).label("cost"),
            func.avg(AITokenUsage.latency_ms).label("latency")
        )
        .group_by(AITokenUsage.model)
        .order_by(desc("requests"))
        .limit(10)
    )).all()
    
    return {"data": [
        {
            "name": r.model,
            "requests": r.requests,
            "tokens": r.tokens,
            "cost": float(r.cost or 0),
            "latency": float(r.latency or 0)
        } for r in records
    ]}


@router.get("/trends")
async def get_trends(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser)
) -> Any:
    """Last 30 days trends for tokens and costs."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=30)
    
    records = (await db.execute(
        select(
            func.date_trunc('day', AITokenUsage.created_at).label("day"),
            func.sum(AITokenUsage.total_tokens).label("tokens"),
            func.sum(AITokenUsage.cost_usd).label("cost"),
            func.count(AITokenUsage.id).label("requests")
        )
        .where(AITokenUsage.created_at >= start_date)
        .group_by("day")
        .order_by("day")
    )).all()
    
    # Fill in missing days
    days = {}
    for i in range(30):
        d = (now - timedelta(days=i)).strftime("%b %d")
        days[d] = {"date": d, "tokens": 0, "cost": 0.0, "requests": 0}
        
    for r in records:
        if r.day:
            d = r.day.strftime("%b %d")
            if d in days:
                days[d] = {
                    "date": d,
                    "tokens": r.tokens or 0,
                    "cost": float(r.cost or 0),
                    "requests": r.requests or 0
                }
                
    result = list(days.values())
    result.reverse() # chronological
    return {"data": result}


@router.get("/organizations")
async def get_organizations(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser)
) -> Any:
    """Top organizations by AI usage."""
    records = (await db.execute(
        select(
            Tenant.name,
            func.count(AITokenUsage.id).label("requests"),
            func.sum(AITokenUsage.total_tokens).label("tokens"),
            func.sum(AITokenUsage.cost_usd).label("cost"),
            func.avg(AITokenUsage.latency_ms).label("latency")
        )
        .join(Tenant, AITokenUsage.tenant_id == Tenant.id)
        .group_by(Tenant.name)
        .order_by(desc("cost"))
        .limit(10)
    )).all()
    
    return {"data": [
        {
            "name": r.name,
            "requests": r.requests,
            "tokens": r.tokens,
            "cost": float(r.cost or 0),
            "latency": float(r.latency or 0)
        } for r in records
    ]}


@router.get("/features")
async def get_features(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser)
) -> Any:
    """Usage by product feature."""
    records = (await db.execute(
        select(
            AITokenUsage.feature,
            func.count(AITokenUsage.id).label("requests"),
            func.sum(AITokenUsage.total_tokens).label("tokens"),
            func.sum(AITokenUsage.cost_usd).label("cost")
        )
        .group_by(AITokenUsage.feature)
        .order_by(desc("requests"))
    )).all()
    
    return {"data": [
        {
            "name": r.feature.replace("_", " ").title(),
            "requests": r.requests,
            "tokens": r.tokens,
            "cost": float(r.cost or 0)
        } for r in records
    ]}


@router.get("/activity")
async def get_activity(
    db: AsyncSession = Depends(get_async_session),
    current_user: Any = Depends(get_current_superuser),
    limit: int = Query(20, ge=1, le=100)
) -> Any:
    """Latest individual AI requests."""
    records = (await db.execute(
        select(
            AITokenUsage,
            Tenant.name.label("tenant_name"),
            User.email.label("user_email")
        )
        .join(Tenant, AITokenUsage.tenant_id == Tenant.id)
        .outerjoin(User, AITokenUsage.user_id == User.id)
        .order_by(desc(AITokenUsage.created_at))
        .limit(limit)
    )).all()
    
    return {"data": [
        {
            "id": r.AITokenUsage.id,
            "tenant": r.tenant_name,
            "user": r.user_email or "System",
            "feature": r.AITokenUsage.feature,
            "model": r.AITokenUsage.model,
            "tokens": r.AITokenUsage.total_tokens,
            "cost": r.AITokenUsage.cost_usd,
            "latency_ms": r.AITokenUsage.latency_ms,
            "status": r.AITokenUsage.status_code,
            "date": r.AITokenUsage.created_at.isoformat()
        } for r in records
    ]}
