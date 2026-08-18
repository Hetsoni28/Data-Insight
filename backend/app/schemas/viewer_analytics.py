from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import uuid
from datetime import datetime

class ViewerAnalyticsKpi(BaseModel):
    id: str
    title: str
    value: Union[str, float, int]
    previous_value: Optional[Union[str, float, int]] = None
    percentage_change: Optional[float] = None
    change_pct: Optional[float] = None
    trend_direction: Optional[str] = None
    trend: Optional[str] = None
    sparkline: List[float] = []
    is_currency: Optional[bool] = None

    class Config:
        extra = "allow"

class ViewerAnalyticsKpisResponse(BaseModel):
    domain: str = "General Business"
    kpis: List[ViewerAnalyticsKpi]

class ViewerAnalyticsTrend(BaseModel):
    id: str
    title: str
    metric: Optional[str] = None
    type: Optional[str] = "line"
    x_axis_key: Optional[str] = "date"
    y_axis_key: Optional[str] = "value"
    data: List[Dict[str, Any]] = []

    class Config:
        extra = "allow"

class ViewerAnalyticsTrendsResponse(BaseModel):
    trends: List[ViewerAnalyticsTrend]

class ViewerAnalyticsPerformanceItem(BaseModel):
    id: str
    name: str
    value: float
    growth: Optional[float] = 0.0
    contribution: Optional[float] = 0.0
    trend: Optional[str] = "neutral"

    class Config:
        extra = "allow"

class ViewerAnalyticsPerformance(BaseModel):
    dimension: str
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
    trend: str

    class Config:
        extra = "allow"

class ViewerAnalyticsComparisonsResponse(BaseModel):
    comparisons: List[ViewerAnalyticsComparison]

class ViewerAnalyticsForecast(BaseModel):
    id: str
    title: str
    metric: str
    historical_data: List[Dict[str, Any]] = []
    predicted_data: List[Dict[str, Any]] = []
    confidence_interval: List[Dict[str, Any]] = []
    model_accuracy: Optional[float] = None

    class Config:
        extra = "allow"

class ViewerAnalyticsForecastResponse(BaseModel):
    forecasts: List[ViewerAnalyticsForecast]

class ViewerAnalyticsAnomaly(BaseModel):
    id: str
    metric: str
    date: str
    expected_value: float
    actual_value: float
    magnitude: float
    severity: str
    possible_explanation: Optional[str] = None

class ViewerAnalyticsAnomaliesResponse(BaseModel):
    anomalies: List[ViewerAnalyticsAnomaly]

class ViewerAnalyticsInsight(BaseModel):
    id: str
    type: str
    content: str

    class Config:
        extra = "allow"

class ViewerAnalyticsInsightsResponse(BaseModel):
    executive_summary: str = ""
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
    context: Optional[Dict[str, Any]] = {}

class ViewerAnalyticsAIChatResponse(BaseModel):
    response: str
