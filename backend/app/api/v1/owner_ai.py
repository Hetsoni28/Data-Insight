from typing import Any, List, Dict
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
import json
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc, case

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
from app.models.chat import ChatSession, ChatMessage
from app.services.gemini_service import gemini_service

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
            func.sum(case((AIUsageLog.status_code != 200, 1), else_=0))
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
        },
        # Legacy support for ai-usage page
        "total_requests": total_requests, 
        "monthly_requests": total_requests,
        "total_tokens": total_tokens,
        "average_tokens_per_request": (total_tokens / total_requests) if total_requests else 0,
        "total_cost": total_cost,
        "average_cost_per_request": (total_cost / total_requests) if total_requests else 0,
        "avg_latency": avg_latency,
        "uptime": round(success_rate, 2),
        "active_models": models_count or 0,
        "active_organizations": 0, 
        "success_rate": round(success_rate, 2),
        "failed_requests": total_errors,
    }

@router.get("/providers")
async def get_providers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get all configured AI providers with real aggregated usage and live status."""
    result = await db.execute(
        select(
            AIProvider,
            func.count(AIUsageLog.id).label("requests"),
            func.coalesce(func.sum(AIUsageLog.tokens_total), 0).label("tokens"),
            func.coalesce(func.sum(AIUsageLog.cost_usd), Decimal("0.0")).label("cost"),
            func.coalesce(func.avg(AIUsageLog.latency_ms), 0).label("avg_lat"),
            func.sum(case((AIUsageLog.status_code != 200, 1), else_=0)).label("errors")
        )
        .outerjoin(AIUsageLog, AIUsageLog.provider_id == AIProvider.id)
        .group_by(AIProvider.id)
        .order_by(desc("requests"), AIProvider.name)
    )
    
    data = []
    for p, reqs, tokens, cost, avg_lat, errors in result.all():
        req_count = int(reqs or 0)
        err_count = int(errors or 0)
        success_rate = round(100.0 - (err_count / req_count * 100), 1) if req_count > 0 else 100.0
        
        data.append({
            "id": str(p.id),
            "name": p.name,
            "base_url": p.base_url,
            "status": p.status,
            "health_score": success_rate,
            "latency_ms": int(avg_lat or 0),
            "is_active": p.is_active,
            "environment": p.environment,
            "cost": float(cost or 0.0),
            "tokens": int(tokens or 0),
            "requests": req_count,
        })
        
    return {"providers": data, "data": data}

@router.get("/models")
async def get_models(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Get all AI models across all providers with real aggregated usage."""
    result = await db.execute(
        select(
            AIModel, 
            AIProvider,
            func.count(AIUsageLog.id).label("requests_count"),
            func.coalesce(func.sum(AIUsageLog.tokens_total), 0).label("tokens_sum"),
            func.coalesce(func.sum(AIUsageLog.cost_usd), Decimal("0.0")).label("cost_sum"),
            func.coalesce(func.avg(AIUsageLog.latency_ms), 0).label("avg_lat")
        )
        .join(AIProvider, AIModel.provider_id == AIProvider.id)
        .outerjoin(AIUsageLog, AIUsageLog.model_id == AIModel.id)
        .group_by(AIModel.id, AIProvider.id)
        .order_by(desc("requests_count"), AIProvider.name)
    )
    
    models = []
    for model, provider, reqs, tokens, cost, avg_lat in result.all():
        models.append({
            "id": str(model.id),
            "name": model.name,
            "provider": provider.name,
            "type": model.type,
            "context_window": model.context_window,
            "input_cost": float(model.input_cost_per_1k),
            "output_cost": float(model.output_cost_per_1k),
            "quality_score": model.quality_score,
            "is_active": model.is_active,
            # Real metrics mapped to legacy keys
            "requests": int(reqs or 0),
            "tokens": int(tokens or 0),
            "cost": round(float(cost or 0.0), 4),
            "latency": int(avg_lat or 0),
            "trend": "up"
        })
        
    return {"models": models, "data": models}

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
    if db.bind.dialect.name == "sqlite":
        day_expr = func.strftime("%Y-%m-%d", AIUsageLog.created_at).label("day")
    else:
        day_expr = func.date_trunc("day", AIUsageLog.created_at).label("day")

    query = (
        select(
            day_expr,
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
            "date": row.day if isinstance(row.day, str) else row.day.strftime("%Y-%m-%d"),
            "requests": int(row.requests),
            "cost": float(row.cost)
        })
        
    return {"timeseries": timeseries}

@router.get("/trends")
async def get_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Alias for timeseries to support legacy ai-usage page."""
    res = await get_usage_timeseries(days=7, db=db, current_user=current_user)
    
    # Map 'date' to 'name' which AiProviderAnalytics uses
    data = []
    for t in res["timeseries"]:
        data.append({
            "name": t["date"],
            "requests": t["requests"],
            "cost": t["cost"]
        })
        
    return {"data": data}

@router.get("/organizations")
async def get_org_usage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Real per-org AI usage grouped from AIUsageLog."""
    from app.models.tenant import Tenant
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(
            Tenant.id,
            Tenant.name,
            func.count(AIUsageLog.id).label("requests"),
            func.coalesce(func.sum(AIUsageLog.tokens_total), 0).label("tokens"),
            func.coalesce(func.sum(AIUsageLog.cost_usd), Decimal("0.0")).label("cost"),
        )
        .join(AIUsageLog, AIUsageLog.tenant_id == Tenant.id)
        .where(AIUsageLog.created_at >= seven_days_ago)
        .group_by(Tenant.id, Tenant.name)
        .order_by(func.sum(AIUsageLog.cost_usd).desc())
        .limit(10)
    )
    rows = result.all()
    return {
        "data": [
            {
                "id": str(r.id),
                "name": r.name,
                "requests": r.requests,
                "tokens": r.tokens,
                "cost": round(float(r.cost), 4),
            }
            for r in rows
        ]
    }


@router.get("/activity")
async def get_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Real AI activity feed from the latest AIUsageLog records."""
    from app.models.tenant import Tenant
    result = await db.execute(
        select(
            AIUsageLog.id,
            AIUsageLog.task_type.label("feature"),
            AIModel.name.label("model"),
            AIUsageLog.tokens_total.label("tokens_used"),
            AIUsageLog.cost_usd,
            AIUsageLog.status_code,
            AIUsageLog.latency_ms,
            AIUsageLog.created_at,
            Tenant.name.label("tenant_name"),
        )
        .join(Tenant, AIUsageLog.tenant_id == Tenant.id)
        .outerjoin(AIModel, AIUsageLog.model_id == AIModel.id)
        .order_by(desc(AIUsageLog.created_at))
        .limit(20)
    )
    rows = result.all()
    return {
        "data": [
            {
                "id": str(r.id),
                "tenant": r.tenant_name,
                "feature": r.feature or "analysis",
                "model": r.model or "Default",
                "tokens": r.tokens_used or 0,
                "cost": round(float(r.cost_usd or 0), 4),
                "latency_ms": r.latency_ms or 0,
                "status": "success" if r.status_code == 200 else "error",
                "date": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }

@router.get("/analytics-charts")
async def get_analytics_charts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Return real data for the AI Analytics Charts (Usage, Distribution, Latency)."""
    # 1. Usage Over Time (last 7 days, requests and cost)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    if db.bind.dialect.name == "sqlite":
        day_expr = func.strftime("%Y-%m-%d", AIUsageLog.created_at).label("day")
    else:
        day_expr = func.date_trunc("day", AIUsageLog.created_at).label("day")

    usage_query = (
        select(
            day_expr,
            func.count(AIUsageLog.id).label('requests'),
            func.sum(AIUsageLog.cost_usd).label('cost')
        )
        .where(AIUsageLog.created_at >= seven_days_ago)
        .group_by('day')
        .order_by('day')
    )
    usage_res = await db.execute(usage_query)
    token_usage_data = []
    for row in usage_res.all():
        if isinstance(row.day, str):
            import datetime as dt
            parsed_date = dt.datetime.strptime(row.day, "%Y-%m-%d")
            date_str = parsed_date.strftime("%b %d")
        else:
            date_str = row.day.strftime("%b %d")

        token_usage_data.append({
            "date": date_str,
            "requests": int(row.requests),
            "cost": float(row.cost)
        })

    # 2. Model Distribution (based on usage)
    dist_query = (
        select(AIModel.name, func.count(AIUsageLog.id).label('count'))
        .join(AIUsageLog, AIUsageLog.model_id == AIModel.id)
        .group_by(AIModel.name)
        .order_by(desc('count'))
        .limit(4)
    )
    dist_res = await db.execute(dist_query)
    
    colors = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444']
    model_distribution_data = []
    for idx, row in enumerate(dist_res.all()):
        model_distribution_data.append({
            "name": row.name,
            "value": int(row.count),
            "color": colors[idx % len(colors)]
        })

    # 3. Latency (hourly for today)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    if db.bind.dialect.name == "sqlite":
        hour_expr = func.strftime("%Y-%m-%d %H:00:00", AIUsageLog.created_at).label("hour")
    else:
        hour_expr = func.date_trunc("hour", AIUsageLog.created_at).label("hour")

    latency_query = (
        select(
            hour_expr,
            func.avg(AIUsageLog.latency_ms).label('p50'),
            func.max(AIUsageLog.latency_ms).label('p99')
        )
        .where(AIUsageLog.created_at >= today)
        .group_by('hour')
        .order_by('hour')
    )
    latency_res = await db.execute(latency_query)
    latency_data = []
    for row in latency_res.all():
        if isinstance(row.hour, str):
            import datetime as dt
            parsed_hour = dt.datetime.strptime(row.hour, "%Y-%m-%d %H:00:00")
            hour_str = parsed_hour.strftime("%H:00")
        else:
            hour_str = row.hour.strftime("%H:00")

        latency_data.append({
            "time": hour_str,
            "p50": int(row.p50 or 0),
            "p99": int(row.p99 or 0)
        })

    return {
        "tokenUsageData": token_usage_data,
        "modelDistributionData": model_distribution_data,
        "latencyData": latency_data
    }

class ChatMessageSchema(BaseModel):
    role: str
    content: str

class Artifact(BaseModel):
    type: str
    title: str
    content: str

class ChatResponse(BaseModel):
    response: str
    session_id: str
    artifact: Optional[Artifact] = None

from fastapi import Request

@router.post("/chat", response_model=ChatResponse)
async def chat_with_command_center(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    form = await request.form()
    workspace_id = form.get("workspace_id")
    message = form.get("message")
    history = form.get("history", "[]")
    session_id = form.get("session_id")
    files = form.getlist("files")
    
    if not workspace_id or not message:
        raise HTTPException(status_code=422, detail="workspace_id and message are required")

    try:
        parsed_history = json.loads(history)
    except Exception:
        parsed_history = []
        
    history_dicts = [{"role": msg.get("role", "user"), "content": msg.get("content", "")} for msg in parsed_history]
    
    file_list = files if files is not None else []
    
    response_text = await gemini_service.generate_chat_response(
        db=db,
        tenant_id=current_user.tenant_id,
        message=message,
        history=history_dicts,
        files=file_list
    )

    import uuid
    # Handle DB Session
    if not session_id or session_id == "undefined":
        chat_session = ChatSession(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            title=message[:40] + "..." if len(message) > 40 else message
        )
        db.add(chat_session)
        await db.commit()
        await db.refresh(chat_session)
        session_uuid = chat_session.id
        session_id_str = str(chat_session.id)
    else:
        session_uuid = uuid.UUID(session_id)
        session_id_str = session_id
        
    # Save User Message
    user_msg = ChatMessage(
        session_id=session_uuid,
        role="user",
        content=message
    )
    db.add(user_msg)
    await db.commit()

    artifact = None
    if "```json" in response_text and "artifact_type" in response_text:
        # simple extraction
        pass

    # Save Assistant Message
    assistant_msg = ChatMessage(
        session_id=session_uuid,
        role="assistant",
        content=response_text
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(response=response_text, session_id=session_id_str, artifact=artifact)

@router.get("/chat/sessions")
async def get_chat_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    stmt = select(ChatSession).where(
        ChatSession.tenant_id == current_user.tenant_id,
        ChatSession.user_id == current_user.id
    ).order_by(desc(ChatSession.updated_at)).limit(20)
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "created_at": s.created_at,
            "updated_at": s.updated_at
        } for s in sessions
    ]

@router.get("/chat/sessions/{session_id}")
async def get_chat_session_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    # Verify ownership
    session_stmt = select(ChatSession).where(
        ChatSession.id == session_id,
        ChatSession.tenant_id == current_user.tenant_id
    )
    result = await db.execute(session_stmt)
    chat_session = result.scalars().first()
    
    if not chat_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    msg_stmt = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(asc(ChatMessage.created_at))
    msg_result = await db.execute(msg_stmt)
    messages = msg_result.scalars().all()
    
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at
        } for m in messages
    ]
