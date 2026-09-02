import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, RequirePermission
from app.models.user import User
from app.services.tenant_analytics import TenantAnalyticsService
from app.schemas.viewer_analytics import (
    ViewerAnalyticsKpisResponse,
    ViewerAnalyticsTrendsResponse,
    ViewerAnalyticsPerformanceResponse,
    ViewerAnalyticsComparisonsResponse,
    ViewerAnalyticsForecastResponse,
    ViewerAnalyticsAnomaliesResponse,
    ViewerAnalyticsInsightsResponse,
    ViewerAnalyticsDataQualityResponse,
    ViewerAnalyticsSavedViewsResponse,
    ViewerAnalyticsSavedViewCreate,
    ViewerAnalyticsSavedView,
    ViewerAnalyticsAIChatRequest,
    ViewerAnalyticsAIChatResponse,
)
from datetime import datetime, timezone

router = APIRouter(prefix="/tenant-analytics", tags=["Tenant Analytics"])

import json
from app.db.redis import get_redis_pool
from redis.asyncio import Redis


@router.get("/kpis", response_model=ViewerAnalyticsKpisResponse)
async def get_kpis(
    dataset_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    pool = await get_redis_pool()
    client = Redis(connection_pool=pool)
    cache_key = f"tenant:{current_user.tenant_id}:analytics:kpis:{dataset_id or 'all'}"
    cached = await client.get(cache_key)
    if cached:
        return json.loads(cached)

    service = TenantAnalyticsService(db)
    result = await service.get_kpis(current_user, dataset_id)
    await client.setex(cache_key, 300, json.dumps(result))  # 5 minutes cache
    return result


@router.get("/trends", response_model=ViewerAnalyticsTrendsResponse)
async def get_trends(
    dataset_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    pool = await get_redis_pool()
    client = Redis(connection_pool=pool)
    cache_key = (
        f"tenant:{current_user.tenant_id}:analytics:trends:{dataset_id or 'all'}"
    )
    cached = await client.get(cache_key)
    if cached:
        return json.loads(cached)

    service = TenantAnalyticsService(db)
    result = await service.get_trends(current_user, dataset_id)
    await client.setex(cache_key, 300, json.dumps(result))
    return result


@router.get("/performance", response_model=ViewerAnalyticsPerformanceResponse)
async def get_performance(
    dataset_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    pool = await get_redis_pool()
    client = Redis(connection_pool=pool)
    cache_key = (
        f"tenant:{current_user.tenant_id}:analytics:performance:{dataset_id or 'all'}"
    )
    cached = await client.get(cache_key)
    if cached:
        return json.loads(cached)

    service = TenantAnalyticsService(db)
    result = await service.get_performance(current_user, dataset_id)
    await client.setex(cache_key, 300, json.dumps(result))
    return result


@router.get("/anomalies", response_model=ViewerAnalyticsAnomaliesResponse)
async def get_anomalies(
    dataset_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    pool = await get_redis_pool()
    client = Redis(connection_pool=pool)
    cache_key = (
        f"tenant:{current_user.tenant_id}:analytics:anomalies:{dataset_id or 'all'}"
    )
    cached = await client.get(cache_key)
    if cached:
        return json.loads(cached)

    service = TenantAnalyticsService(db)
    result = await service.get_anomalies(current_user, dataset_id)
    await client.setex(cache_key, 300, json.dumps(result))
    return result


@router.get("/data-quality", response_model=ViewerAnalyticsDataQualityResponse)
async def get_data_quality(
    dataset_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    service = TenantAnalyticsService(db)
    return await service.get_data_quality(current_user, dataset_id)


@router.get("/comparisons", response_model=ViewerAnalyticsComparisonsResponse)
async def get_comparisons(
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    service = TenantAnalyticsService(db)
    return await service.get_comparisons(current_user)


@router.get("/forecast", response_model=ViewerAnalyticsForecastResponse)
async def get_forecast(
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    service = TenantAnalyticsService(db)
    return await service.get_forecast(current_user)


@router.get("/ai-insights", response_model=ViewerAnalyticsInsightsResponse)
async def get_ai_insights(
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    service = TenantAnalyticsService(db)
    return await service.get_ai_insights(current_user)


@router.post("/ai/chat", response_model=ViewerAnalyticsAIChatResponse)
async def chat_ai(
    req: ViewerAnalyticsAIChatRequest,
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    service = TenantAnalyticsService(db)
    res = await service.chat_ai(current_user, req.message, req.context)
    return {"response": res}


# Saved Views (stored in user preferences)
@router.get("/saved-views", response_model=ViewerAnalyticsSavedViewsResponse)
async def get_saved_views(
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    prefs = current_user.preferences or {}
    views = prefs.get("saved_analytics_views", [])
    return {"views": views}


@router.post("/saved-views", response_model=ViewerAnalyticsSavedView)
async def create_saved_view(
    view_in: ViewerAnalyticsSavedViewCreate,
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    prefs = current_user.preferences or {}
    views = prefs.get("saved_analytics_views", [])
    new_view = {
        "id": str(uuid.uuid4()),
        "name": view_in.name,
        "filters": view_in.filters,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    views.append(new_view)
    prefs["saved_analytics_views"] = views
    current_user.preferences = prefs
    db.add(current_user)
    await db.commit()
    return new_view


@router.delete("/saved-views/{view_id}")
async def delete_saved_view(
    view_id: str = Path(...),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
    db: AsyncSession = Depends(get_db),
):
    prefs = current_user.preferences or {}
    views = prefs.get("saved_analytics_views", [])
    filtered = [v for v in views if v["id"] != view_id]
    prefs["saved_analytics_views"] = filtered
    current_user.preferences = prefs
    db.add(current_user)
    await db.commit()
    return {"status": "success"}
