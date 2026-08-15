import uuid
from fastapi import APIRouter, Depends, Query, Path
from typing import Dict, Any

from app.api.deps import get_current_viewer, get_db
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.viewer_analytics import ViewerAnalyticsService
from app.schemas.viewer_analytics import (
    ViewerAnalyticsKpisResponse, ViewerAnalyticsTrendsResponse,
    ViewerAnalyticsPerformanceResponse, ViewerAnalyticsComparisonsResponse,
    ViewerAnalyticsForecastResponse, ViewerAnalyticsAnomaliesResponse,
    ViewerAnalyticsInsightsResponse, ViewerAnalyticsDataQualityResponse,
    ViewerAnalyticsSavedViewsResponse, ViewerAnalyticsSavedViewCreate, ViewerAnalyticsSavedView,
    ViewerAnalyticsAIChatRequest, ViewerAnalyticsAIChatResponse
)
from datetime import datetime, timezone

router = APIRouter(prefix="/viewer/analytics", tags=["Viewer Analytics"])

@router.get("/kpis", response_model=ViewerAnalyticsKpisResponse)
async def get_kpis(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_kpis(current_user)

@router.get("/trends", response_model=ViewerAnalyticsTrendsResponse)
async def get_trends(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_trends(current_user)

@router.get("/performance", response_model=ViewerAnalyticsPerformanceResponse)
async def get_performance(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_performance(current_user)

@router.get("/comparisons", response_model=ViewerAnalyticsComparisonsResponse)
async def get_comparisons(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_comparisons(current_user)

@router.get("/forecast", response_model=ViewerAnalyticsForecastResponse)
async def get_forecast(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_forecast(current_user)

@router.get("/anomalies", response_model=ViewerAnalyticsAnomaliesResponse)
async def get_anomalies(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_anomalies(current_user)

@router.get("/ai-insights", response_model=ViewerAnalyticsInsightsResponse)
async def get_ai_insights(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_ai_insights(current_user)

@router.get("/data-quality", response_model=ViewerAnalyticsDataQualityResponse)
async def get_data_quality(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    return await service.get_data_quality(current_user)

@router.post("/ai/chat", response_model=ViewerAnalyticsAIChatResponse)
async def chat_ai(
    req: ViewerAnalyticsAIChatRequest,
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    service = ViewerAnalyticsService(db)
    res = await service.chat_ai(current_user, req.message, req.context)
    return {"response": res}

# Saved Views (stored in user preferences)
@router.get("/saved-views", response_model=ViewerAnalyticsSavedViewsResponse)
async def get_saved_views(
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    prefs = current_user.preferences or {}
    views = prefs.get("saved_analytics_views", [])
    return {"views": views}

@router.post("/saved-views", response_model=ViewerAnalyticsSavedView)
async def create_saved_view(
    view_in: ViewerAnalyticsSavedViewCreate,
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    prefs = current_user.preferences or {}
    views = prefs.get("saved_analytics_views", [])

    new_view = {
        "id": str(uuid.uuid4()),
        "name": view_in.name,
        "filters": view_in.filters,
        "created_at": datetime.now(timezone.utc).isoformat()
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
    current_user: User = Depends(get_current_viewer),
    db: AsyncSession = Depends(get_db)
):
    prefs = current_user.preferences or {}
    views = prefs.get("saved_analytics_views", [])

    filtered = [v for v in views if v["id"] != view_id]
    prefs["saved_analytics_views"] = filtered
    current_user.preferences = prefs

    db.add(current_user)
    await db.commit()

    return {"status": "success"}
