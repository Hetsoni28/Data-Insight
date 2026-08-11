import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_tenant_user, get_db
from app.models.user import User, UserRole
from app.core.exceptions import ForbiddenException
from app.services.manager_analytics import ManagerAnalyticsService
from app.schemas.manager_analytics import (
    ManagerAnalyticsKpisResponse,
    ManagerAnalyticsTrendsResponse,
    ManagerAnalyticsPerformanceResponse,
    ManagerAnalyticsAnomaliesResponse,
    ManagerAnalyticsDataQualityResponse
)

router = APIRouter(prefix="/manager/analytics", tags=["Manager Analytics"])

def ensure_manager(user: User):
    if user.role != UserRole.manager and user.role != UserRole.owner and user.role != UserRole.org_admin:
        raise ForbiddenException("Only Managers and above can access the manager analytics workspace.")

@router.get("/kpis", response_model=ManagerAnalyticsKpisResponse)
async def get_manager_kpis(
    dataset_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    ensure_manager(current_user)
    svc = ManagerAnalyticsService(db)
    return await svc.get_kpis(dataset_id, current_user)

@router.get("/trends", response_model=ManagerAnalyticsTrendsResponse)
async def get_manager_trends(
    dataset_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    ensure_manager(current_user)
    svc = ManagerAnalyticsService(db)
    return await svc.get_trends(dataset_id, current_user)

@router.get("/performance", response_model=ManagerAnalyticsPerformanceResponse)
async def get_manager_performance(
    dataset_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    ensure_manager(current_user)
    svc = ManagerAnalyticsService(db)
    return await svc.get_performance(dataset_id, current_user)

@router.get("/anomalies", response_model=ManagerAnalyticsAnomaliesResponse)
async def get_manager_anomalies(
    dataset_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    ensure_manager(current_user)
    svc = ManagerAnalyticsService(db)
    return await svc.get_anomalies(dataset_id, current_user)

@router.get("/data-quality", response_model=ManagerAnalyticsDataQualityResponse)
async def get_manager_data_quality(
    dataset_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    ensure_manager(current_user)
    svc = ManagerAnalyticsService(db)
    return await svc.get_data_quality(dataset_id, current_user)
