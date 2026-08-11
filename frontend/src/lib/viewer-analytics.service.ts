import axios from 'axios';
import { useWorkspaceStore } from '@/store/workspaceStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  _getHeaders(workspaceId?: string) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };
    
    const wsId = workspaceId || useWorkspaceStore.getState().activeWs?.id;
    if (wsId) {
      headers['X-Workspace-Id'] = wsId;
    }
    return headers;
  },

  async getKpis(workspaceId?: string): Promise<ViewerAnalyticsKpisResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/kpis`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getTrends(workspaceId?: string): Promise<ViewerAnalyticsTrendsResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/trends`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getPerformance(workspaceId?: string): Promise<ViewerAnalyticsPerformanceResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/performance`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getComparisons(workspaceId?: string): Promise<ViewerAnalyticsComparisonsResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/comparisons`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getForecast(workspaceId?: string): Promise<ViewerAnalyticsForecastResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/forecast`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getAnomalies(workspaceId?: string): Promise<ViewerAnalyticsAnomaliesResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/anomalies`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getAiInsights(workspaceId?: string): Promise<ViewerAnalyticsInsightsResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/ai-insights`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getDataQuality(workspaceId?: string): Promise<ViewerAnalyticsDataQualityResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/data-quality`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async getSavedViews(workspaceId?: string): Promise<ViewerAnalyticsSavedViewsResponse> {
    const res = await axios.get(`${API_URL}/viewer/analytics/saved-views`, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async createSavedView(name: string, filters: Record<string, any>, workspaceId?: string): Promise<ViewerAnalyticsSavedView> {
    const res = await axios.post(`${API_URL}/viewer/analytics/saved-views`, { name, filters }, { headers: this._getHeaders(workspaceId) });
    return res.data;
  },

  async deleteSavedView(viewId: string, workspaceId?: string): Promise<void> {
    await axios.delete(`${API_URL}/viewer/analytics/saved-views/${viewId}`, { headers: this._getHeaders(workspaceId) });
  },

  async chatAi(message: string, context: Record<string, any>, workspaceId?: string): Promise<ViewerAnalyticsAIChatResponse> {
    const res = await axios.post(`${API_URL}/viewer/analytics/ai/chat`, { message, context }, { headers: this._getHeaders(workspaceId) });
    return res.data;
  }
};
