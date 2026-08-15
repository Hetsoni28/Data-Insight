import api from './api';
import { useWorkspaceStore } from '@/store/workspaceStore';

export interface ViewerAnalyticsKpi {
  id: string;
  title: string;
  value: string;
  previous_value?: string;
  percentage_change?: number;
  trend_direction?: "up" | "down" | "neutral";
  sparkline: number[];
}

export interface ViewerAnalyticsKpisResponse {
  domain: string;
  kpis: ViewerAnalyticsKpi[];
}

export interface ViewerAnalyticsTrend {
  id: string;
  title: string;
  type: string;
  x_axis_key: string;
  y_axis_key: string;
  data: Record<string, any>[];
}

export interface ViewerAnalyticsTrendsResponse {
  trends: ViewerAnalyticsTrend[];
}

export interface ViewerAnalyticsPerformanceItem {
  id: string;
  name: string;
  value: number;
  growth: number;
  contribution: number;
  trend: string;
}

export interface ViewerAnalyticsPerformance {
  dimension: string;
  items: ViewerAnalyticsPerformanceItem[];
}

export interface ViewerAnalyticsPerformanceResponse {
  performances: ViewerAnalyticsPerformance[];
}

export interface ViewerAnalyticsComparison {
  id: string;
  title: string;
  entity_a: string;
  entity_b: string;
  value_a: number;
  value_b: number;
  absolute_difference: number;
  percentage_difference: number;
  trend: string;
}

export interface ViewerAnalyticsComparisonsResponse {
  comparisons: ViewerAnalyticsComparison[];
}

export interface ViewerAnalyticsForecast {
  id: string;
  title: string;
  metric: string;
  historical_data: Record<string, any>[];
  predicted_data: Record<string, any>[];
  confidence_interval: Record<string, any>[];
  model_accuracy: number;
}

export interface ViewerAnalyticsForecastResponse {
  forecasts: ViewerAnalyticsForecast[];
}

export interface ViewerAnalyticsAnomaly {
  id: string;
  metric: string;
  date: string;
  expected_value: number;
  actual_value: number;
  magnitude: number;
  severity: "high" | "medium" | "low";
  possible_explanation?: string;
}

export interface ViewerAnalyticsAnomaliesResponse {
  anomalies: ViewerAnalyticsAnomaly[];
}

export interface ViewerAnalyticsInsight {
  id: string;
  type: "trend" | "risk" | "opportunity" | "recommendation";
  content: string;
}

export interface ViewerAnalyticsInsightsResponse {
  executive_summary: string;
  insights: ViewerAnalyticsInsight[];
}

export interface ViewerAnalyticsDataQuality {
  dataset_id: string;
  dataset_name: string;
  completeness: number;
  missing_values: number;
  duplicate_records: number;
  quality_score: number;
}

export interface ViewerAnalyticsDataQualityResponse {
  quality_reports: ViewerAnalyticsDataQuality[];
}

export interface ViewerAnalyticsSavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  created_at: string;
}

export interface ViewerAnalyticsSavedViewsResponse {
  views: ViewerAnalyticsSavedView[];
}

export interface ViewerAnalyticsAIChatRequest {
  message: string;
  context: Record<string, any>;
}

export interface ViewerAnalyticsAIChatResponse {
  response: string;
}

export const ViewerAnalyticsService = {
  _getWorkspaceId(workspaceId?: string) {
    return workspaceId || useWorkspaceStore.getState().activeWs?.id;
  },

  async getKpis(workspaceId?: string): Promise<ViewerAnalyticsKpisResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/kpis', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getTrends(workspaceId?: string): Promise<ViewerAnalyticsTrendsResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/trends', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getPerformance(workspaceId?: string): Promise<ViewerAnalyticsPerformanceResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/performance', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getComparisons(workspaceId?: string): Promise<ViewerAnalyticsComparisonsResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/comparisons', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getForecast(workspaceId?: string): Promise<ViewerAnalyticsForecastResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/forecast', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getAnomalies(workspaceId?: string): Promise<ViewerAnalyticsAnomaliesResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/anomalies', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getAiInsights(workspaceId?: string): Promise<ViewerAnalyticsInsightsResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/ai-insights', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getDataQuality(workspaceId?: string): Promise<ViewerAnalyticsDataQualityResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/data-quality', { params: { workspace_id: wsId } });
    return res.data;
  },

  async getSavedViews(workspaceId?: string): Promise<ViewerAnalyticsSavedViewsResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.get('/viewer/analytics/saved-views', { params: { workspace_id: wsId } });
    return res.data;
  },

  async createSavedView(name: string, filters: Record<string, any>, workspaceId?: string): Promise<ViewerAnalyticsSavedView> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.post('/viewer/analytics/saved-views', { name, filters }, { params: { workspace_id: wsId } });
    return res.data;
  },

  async deleteSavedView(viewId: string, workspaceId?: string): Promise<void> {
    const wsId = this._getWorkspaceId(workspaceId);
    await api.delete(`/viewer/analytics/saved-views/${viewId}`, { params: { workspace_id: wsId } });
  },

  async chatAi(message: string, context: Record<string, any>, workspaceId?: string): Promise<ViewerAnalyticsAIChatResponse> {
    const wsId = this._getWorkspaceId(workspaceId);
    const res = await api.post('/viewer/analytics/ai/chat', { message, context }, { params: { workspace_id: wsId } });
    return res.data;
  }
};
