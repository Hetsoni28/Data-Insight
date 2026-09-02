
from pydantic import BaseModel


class ManagerAnalyticsKpi(BaseModel):
    id: str
    title: str
    value: float
    previous_value: float | None = None
    change_pct: float
    trend: str
    is_currency: bool = False


class ManagerAnalyticsTrendItem(BaseModel):
    date: str
    value: float


class ManagerAnalyticsTrend(BaseModel):
    id: str
    title: str
    metric: str
    data: list[ManagerAnalyticsTrendItem]


class ManagerAnalyticsPerformanceItem(BaseModel):
    id: str
    name: str
    value: float
    contribution: float


class ManagerAnalyticsPerformance(BaseModel):
    dimension: str
    items: list[ManagerAnalyticsPerformanceItem]


class ManagerAnalyticsAnomaly(BaseModel):
    id: str
    metric: str
    date: str
    expected_value: float
    actual_value: float
    magnitude: float
    severity: str
    possible_explanation: str


class ManagerAnalyticsInsightsResponse(BaseModel):
    executive_summary: str
    insights: list[dict]


class ManagerAnalyticsDataQuality(BaseModel):
    dataset_id: str
    dataset_name: str
    completeness: float
    missing_values: int
    duplicate_records: int
    quality_score: int


class ManagerAnalyticsKpisResponse(BaseModel):
    kpis: list[ManagerAnalyticsKpi]


class ManagerAnalyticsTrendsResponse(BaseModel):
    trends: list[ManagerAnalyticsTrend]


class ManagerAnalyticsPerformanceResponse(BaseModel):
    performances: list[ManagerAnalyticsPerformance]


class ManagerAnalyticsAnomaliesResponse(BaseModel):
    anomalies: list[ManagerAnalyticsAnomaly]


class ManagerAnalyticsDataQualityResponse(BaseModel):
    quality_reports: list[ManagerAnalyticsDataQuality]
