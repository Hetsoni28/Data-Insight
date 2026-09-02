from datetime import datetime

from pydantic import BaseModel


class DashboardOverviewResponse(BaseModel):
    organization_name: str
    subscription_plan: str
    subscription_status: str
    platform_status: str
    current_ai_provider: str
    greeting: str
    mrr: float = 0.0
    current_period_end: str | None = None


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
    __root__: list[ChartDataPoint]


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
    device: str | None
    browser: str | None
    ip: str | None
    last_active: datetime | None


class FailedLogin(BaseModel):
    id: str
    ip: str | None
    created_at: datetime | None


class SecurityOverviewResponse(BaseModel):
    active_sessions: list[ActiveSession]
    failed_logins: list[FailedLogin]
