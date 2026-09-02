"""Pydantic schemas for the Viewer API."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ViewerWelcomeInfo(BaseModel):
    avatar_url: Optional[str] = None
    greeting: str
    organization_name: Optional[str] = None
    department: Optional[str] = None
    role: str
    workspace_name: Optional[str] = None
    workspace_id: Optional[uuid.UUID] = None
    today_date: str
    recent_login: Optional[str] = None


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
    recent_activity: List[Dict[str, Any]]
    unread_notifications: List[Dict[str, Any]]


class DashboardChartWidget(BaseModel):
    id: str
    type: str  # "bar" | "line" | "pie" | "kpi"
    title: str
    x_axis_key: Optional[str] = None
    y_axis_key: Optional[str] = None
    data: List[Dict[str, Any]]
    metrics: Optional[Dict[str, Any]] = None


class ViewerDashboardResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    dataset_id: uuid.UUID
    dataset_name: str
    department: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    widgets: List[DashboardChartWidget]


class ViewerBookmarkToggleRequest(BaseModel):
    report_id: uuid.UUID


class ViewerBookmarkToggleResponse(BaseModel):
    report_id: uuid.UUID
    is_bookmarked: bool
    message: str


class ViewerAiChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    dataset_id: Optional[uuid.UUID] = None
    report_id: Optional[uuid.UUID] = None
    history: Optional[List[Dict[str, Any]]] = None


class ViewerAiChatResponse(BaseModel):
    answer: str
    model: str


class ViewerReportInsights(BaseModel):
    executive_summary: str
    key_findings: List[str] = []
    trends: List[str] = []
    anomalies: List[str] = []
    risks: List[str] = []
    opportunities: List[str] = []
    recommendations: List[str] = []


class ViewerReportRelatedAsset(BaseModel):
    id: str
    name: str
    type: str  # 'dashboard', 'dataset', 'report', 'forecast'


class ViewerReportPreviewResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    status: str
    department: str
    owner: str
    created_at: datetime
    updated_at: datetime
    data_freshness: str
    ai_generated: bool
    output_url: Optional[str] = None
    widgets: List[DashboardChartWidget] = []


class ViewerReportFiltersResponse(BaseModel):
    categories: List[str] = []
    departments: List[str] = []
    owners: List[str] = []
    statuses: List[str] = []


class ViewerActivityResponse(BaseModel):
    entries: List[Any]
    total: int
    page: int
    size: int


class ViewerReportListResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    size: int
