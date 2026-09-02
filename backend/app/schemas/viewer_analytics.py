import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ViewerAnalyticsKpi(BaseModel):
    id: str
    title: str
    value: Any
    previous_value: Any | None = None
    percentage_change: float | None = None
    change_pct: float | None = None
    trend_direction: str | None = None
    trend: str | None = None
    sparkline: list[float] = []
    is_currency: bool | None = None

    class Config:
        extra = "allow"


class ViewerAnalyticsKpisResponse(BaseModel):
    domain: str = "General Business"
    kpis: list[ViewerAnalyticsKpi]


class ViewerAnalyticsTrend(BaseModel):
    id: str
    title: str
    metric: str | None = None
    type: str | None = "line"
    x_axis_key: str | None = "date"
    y_axis_key: str | None = "value"
    data: list[dict[str, Any]] = []

    class Config:
        extra = "allow"


class ViewerAnalyticsTrendsResponse(BaseModel):
    trends: list[ViewerAnalyticsTrend]


class ViewerAnalyticsPerformanceItem(BaseModel):
    id: str
    name: str
    value: float
    growth: float | None = 0.0
    contribution: float | None = 0.0
    trend: str | None = "neutral"

    class Config:
        extra = "allow"


class ViewerAnalyticsPerformance(BaseModel):
    dimension: str
    items: list[ViewerAnalyticsPerformanceItem]


class ViewerAnalyticsPerformanceResponse(BaseModel):
    performances: list[ViewerAnalyticsPerformance]


class ViewerAnalyticsComparison(BaseModel):
    id: str
    title: str
    entity_a: str
    entity_b: str
    value_a: float
    value_b: float
    absolute_difference: float
    percentage_difference: float
    trend: str

    class Config:
        extra = "allow"


class ViewerAnalyticsComparisonsResponse(BaseModel):
    comparisons: list[ViewerAnalyticsComparison]


class ViewerAnalyticsForecast(BaseModel):
    id: str
    title: str
    metric: str
    historical_data: list[dict[str, Any]] = []
    predicted_data: list[dict[str, Any]] = []
    confidence_interval: list[dict[str, Any]] = []
    model_accuracy: float | None = None

    class Config:
        extra = "allow"


class ViewerAnalyticsForecastResponse(BaseModel):
    forecasts: list[ViewerAnalyticsForecast]


class ViewerAnalyticsAnomaly(BaseModel):
    id: str
    metric: str
    date: str
    expected_value: float
    actual_value: float
    magnitude: float
    severity: str
    possible_explanation: str | None = None


class ViewerAnalyticsAnomaliesResponse(BaseModel):
    anomalies: list[ViewerAnalyticsAnomaly]


class ViewerAnalyticsInsight(BaseModel):
    id: str
    type: str
    content: str

    class Config:
        extra = "allow"


class ViewerAnalyticsInsightsResponse(BaseModel):
    executive_summary: str = ""
    insights: list[ViewerAnalyticsInsight]


class ViewerAnalyticsDataQuality(BaseModel):
    dataset_id: uuid.UUID
    dataset_name: str
    completeness: float
    missing_values: int
    duplicate_records: int
    quality_score: float


class ViewerAnalyticsDataQualityResponse(BaseModel):
    quality_reports: list[ViewerAnalyticsDataQuality]


class ViewerAnalyticsSavedView(BaseModel):
    id: str
    name: str
    filters: dict[str, Any]
    created_at: datetime


class ViewerAnalyticsSavedViewsResponse(BaseModel):
    views: list[ViewerAnalyticsSavedView]


class ViewerAnalyticsSavedViewCreate(BaseModel):
    name: str
    filters: dict[str, Any]


class ViewerAnalyticsAIChatRequest(BaseModel):
    message: str
    context: dict[str, Any] | None = {}


class ViewerAnalyticsAIChatResponse(BaseModel):
    response: str
