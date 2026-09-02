"""Pydantic schemas for the Viewer API."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ViewerWelcomeInfo(BaseModel):
    avatar_url: str | None = None
    greeting: str
    organization_name: str | None = None
    department: str | None = None
    role: str
    workspace_name: str | None = None
    workspace_id: uuid.UUID | None = None
    today_date: str
    recent_login: str | None = None


class ViewerKpis(BaseModel):
    reports_shared: int
    dashboards_available: int
    datasets_available: int
    reports_viewed_today: int
    downloads_count: int
    bookmarks_count: int
    unread_notifications: int
    recent_ai_conversations: int


class ViewerDashboardOverview(BaseModel):
    welcome: ViewerWelcomeInfo
    kpis: ViewerKpis
    recent_activity: list[dict[str, Any]]
    unread_notifications: list[dict[str, Any]]


class DashboardChartWidget(BaseModel):
    id: str
    type: str  # "bar" | "line" | "pie" | "kpi"
    title: str
    x_axis_key: str | None = None
    y_axis_key: str | None = None
    data: list[dict[str, Any]]
    metrics: dict[str, Any] | None = None


class ViewerDashboardResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    dataset_id: uuid.UUID
    dataset_name: str
    department: str | None = None
    created_at: datetime
    updated_at: datetime
    widgets: list[DashboardChartWidget]


class ViewerBookmarkToggleRequest(BaseModel):
    report_id: uuid.UUID


class ViewerBookmarkToggleResponse(BaseModel):
    report_id: uuid.UUID
    is_bookmarked: bool
    message: str


class ViewerAiChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    dataset_id: uuid.UUID | None = None
    report_id: uuid.UUID | None = None
    history: list[dict[str, Any]] | None = None


class ViewerAiChatResponse(BaseModel):
    answer: str
    model: str


class ViewerReportInsights(BaseModel):
    executive_summary: str
    key_findings: list[str] = []
    trends: list[str] = []
    anomalies: list[str] = []
    risks: list[str] = []
    opportunities: list[str] = []
    recommendations: list[str] = []


class ViewerReportRelatedAsset(BaseModel):
    id: str
    name: str
    type: str  # 'dashboard', 'dataset', 'report', 'forecast'


class ViewerReportPreviewResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    category: str
    status: str
    department: str
    owner: str
    created_at: datetime
    updated_at: datetime
    data_freshness: str
    ai_generated: bool
    output_url: str | None = None
    widgets: list[DashboardChartWidget] = []


class ViewerReportFiltersResponse(BaseModel):
    categories: list[str] = []
    departments: list[str] = []
    owners: list[str] = []
    statuses: list[str] = []


class ViewerActivityResponse(BaseModel):
    entries: list[Any]
    total: int
    page: int
    size: int


class ViewerReportListResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int
    page: int
    size: int
