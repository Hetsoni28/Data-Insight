from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uuid


class DashboardOverviewResponse(BaseModel):
    organization_name: str
    subscription_plan: str
    subscription_status: str
    platform_status: str
    current_ai_provider: str
    greeting: str
    mrr: float = 0.0
    current_period_end: Optional[str] = None


class GrowthMetric(BaseModel):
    total: int
    growth: float


class DashboardKPIsResponse(BaseModel):
    active_users: int
    datasets: GrowthMetric
    reports: GrowthMetric
    storage_mb: float
    ai_requests: GrowthMetric
    productivity_score: int
    data_quality_score: int


class ChartDataPoint(BaseModel):
    date: str
    full_date: str
    ai_usage: int
    reports: int
    storage_mb: float


class DashboardChartsResponse(BaseModel):
    __root__: List[ChartDataPoint]


class RecentDataset(BaseModel):
    id: str
    name: str
    rows: int
    columns: int
    status: str
    created_at: datetime


class RecentReport(BaseModel):
    id: str
    title: str
    type: str
    status: str
    created_at: datetime


class ActivityFeedItem(BaseModel):
    id: str
    action: str
    resource_type: str
    status: str
    created_at: datetime


class ActiveSession(BaseModel):
    id: str
    device: Optional[str]
    browser: Optional[str]
    ip: Optional[str]
    last_active: Optional[datetime]


class FailedLogin(BaseModel):
    id: str
    ip: Optional[str]
    created_at: Optional[datetime]


class SecurityOverviewResponse(BaseModel):
    active_sessions: List[ActiveSession]
    failed_logins: List[FailedLogin]
