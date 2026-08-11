from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime

class ViewerAnalyticsKpi(BaseModel):
    id: str
    title: str
    value: str
    previous_value: Optional[str] = None
    percentage_change: Optional[float] = None
    trend_direction: Optional[str] = None # "up", "down", "neutral"
    sparkline: List[float] = []

class ViewerAnalyticsKpisResponse(BaseModel):
    domain: str
    kpis: List[ViewerAnalyticsKpi]

class ViewerAnalyticsTrend(BaseModel):
    id: str
    title: str
    type: str # "line", "bar", "area"
    x_axis_key: str
    y_axis_key: str
    data: List[Dict[str, Any]]

class ViewerAnalyticsTrendsResponse(BaseModel):
    trends: List[ViewerAnalyticsTrend]

class ViewerAnalyticsPerformanceItem(BaseModel):
    id: str
    name: str
    value: float
    growth: float
    contribution: float
    trend: str

class ViewerAnalyticsPerformance(BaseModel):
    dimension: str # e.g. "Products", "Regions"
    items: List[ViewerAnalyticsPerformanceItem]

class ViewerAnalyticsPerformanceResponse(BaseModel):
    performances: List[ViewerAnalyticsPerformance]

class ViewerAnalyticsComparison(BaseModel):
    id: str
    title: str
    entity_a: str
    entity_b: str
    value_a: float
    value_b: float
    absolute_difference: float
    percentage_difference: float
    trend: str # "up", "down"

class ViewerAnalyticsComparisonsResponse(BaseModel):
    comparisons: List[ViewerAnalyticsComparison]

class ViewerAnalyticsForecast(BaseModel):
    id: str
    title: str
    metric: str
    historical_data: List[Dict[str, Any]]
    predicted_data: List[Dict[str, Any]]
    confidence_interval: List[Dict[str, Any]] # e.g. {"date": "...", "upper": 120, "lower": 80}
    model_accuracy: float

class ViewerAnalyticsForecastResponse(BaseModel):
    forecasts: List[ViewerAnalyticsForecast]

class ViewerAnalyticsAnomaly(BaseModel):
    id: str
    metric: str
    date: str
    expected_value: float
    actual_value: float
    magnitude: float
    severity: str # "high", "medium", "low"
    possible_explanation: Optional[str] = None

class ViewerAnalyticsAnomaliesResponse(BaseModel):
    anomalies: List[ViewerAnalyticsAnomaly]

class ViewerAnalyticsInsight(BaseModel):
    id: str
    type: str # "trend", "risk", "opportunity", "recommendation"
    content: str

class ViewerAnalyticsInsightsResponse(BaseModel):
    executive_summary: str
    insights: List[ViewerAnalyticsInsight]

class ViewerAnalyticsDataQuality(BaseModel):
    dataset_id: uuid.UUID
    dataset_name: str
    completeness: float
    missing_values: int
    duplicate_records: int
    quality_score: float

class ViewerAnalyticsDataQualityResponse(BaseModel):
    quality_reports: List[ViewerAnalyticsDataQuality]

class ViewerAnalyticsSavedView(BaseModel):
    id: str
    name: str
    filters: Dict[str, Any]
    created_at: datetime

class ViewerAnalyticsSavedViewsResponse(BaseModel):
    views: List[ViewerAnalyticsSavedView]

class ViewerAnalyticsSavedViewCreate(BaseModel):
    name: str
    filters: Dict[str, Any]

class ViewerAnalyticsAIChatRequest(BaseModel):
    message: str
    context: Dict[str, Any] # e.g. current filters, visible KPI metrics

class ViewerAnalyticsAIChatResponse(BaseModel):
    response: str
