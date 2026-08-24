import api from './api';

export interface AnalyticsKpi {
  id: string;
  title: string;
  value: number | string;
  previous_value?: number | string;
  change_pct?: number;
  percentage_change?: number; // legacy alias
  trend?: "up" | "down" | "neutral";
  trend_direction?: "up" | "down" | "neutral"; // legacy alias
  is_currency?: boolean;
  sparkline?: number[];
}

export interface AnalyticsTrendItem {
  date: string;
  value?: number;
  cumulative_records?: number;
  [key: string]: any;
}

export interface AnalyticsTrend {
  id: string;
  title: string;
  metric?: string;
  type?: string;
  x_axis_key?: string;
  y_axis_key?: string;
  data: AnalyticsTrendItem[];
}

export interface AnalyticsPerformanceItem {
  id: string;
  name: string;
  value: number;
  contribution: number;
  growth?: number;
  trend?: string;
}

export interface AnalyticsPerformance {
  dimension: string;
  items: AnalyticsPerformanceItem[];
}

export interface AnalyticsAnomaly {
  id: string;
  metric: string;
  date: string;
  expected_value: number;
  actual_value: number;
  magnitude: number;
  severity: "high" | "medium" | "low";
  possible_explanation: string;
}

export interface AnalyticsDataQuality {
  dataset_id: string;
  dataset_name: string;
  completeness: number;
  missing_values: number;
  duplicate_records: number;
  quality_score: number;
}

export interface AnalyticsComparison {
  id: string;
  title?: string;
  metric: string;
  segments: { name: string; value: number }[];
  entity_a?: string;
  entity_b?: string;
  value_a?: number;
  value_b?: number;
  absolute_difference?: number;
  percentage_difference?: number;
  trend?: string;
}

export interface AnalyticsForecast {
  id: string;
  metric: string;
  horizon: string;
  title?: string;
  model_accuracy?: number;
  /** Flat data array (compact format) */
  data?: {
    date: string;
    value: number;
    lower_bound: number;
    upper_bound: number;
  }[];
  /** Split historical data (expanded format) */
  historical_data?: { date: string; value: number }[];
  /** Split predicted data (expanded format) */
  predicted_data?: { date: string; value: number }[];
  /** Per-point confidence intervals */
  confidence_interval?: { lower: number; upper: number }[];
}

export interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  /** Alias for description — used by some components */
  content?: string;
  type: "opportunity" | "risk" | "neutral";
  confidence: number;
  action_recommended?: string;
}

export interface AnalyticsSavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  created_at: string;
}

export const AnalyticsService = {
  getKpis: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/kpis`, { params });
    return res.data;
  },

  getTrends: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/trends`, { params });
    return res.data;
  },

  getPerformance: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/performance`, { params });
    return res.data;
  },

  getAnomalies: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/anomalies`, { params });
    return res.data;
  },

  getDataQuality: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/data-quality`, { params });
    return res.data;
  },

  getComparisons: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/comparisons`, { params });
    return res.data;
  },

  getForecast: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/forecast`, { params });
    return res.data;
  },

  getAiInsights: async (workspaceId: string, datasetId?: string) => {
    const params: any = { workspace_id: workspaceId };
    if (datasetId) params.dataset_id = datasetId;
    const res = await api.get(`/tenant-analytics/ai-insights`, { params });
    return res.data;
  },

  chatAi: async (workspaceId: string, message: string, context?: Record<string, any>) => {
    const res = await api.post(`/tenant-analytics/ai/chat`, { message, context }, { params: { workspace_id: workspaceId } });
    return res.data;
  },

  getSavedViews: async (workspaceId: string) => {
    const res = await api.get(`/tenant-analytics/saved-views`, { params: { workspace_id: workspaceId } });
    return res.data.data;
  },

  createSavedView: async (workspaceId: string, name: string, filters: Record<string, any>) => {
    const res = await api.post(`/tenant-analytics/saved-views`, { name, filters }, { params: { workspace_id: workspaceId } });
    return res.data;
  },

  deleteSavedView: async (workspaceId: string, viewId: string) => {
    const res = await api.delete(`/tenant-analytics/saved-views/${viewId}`, { params: { workspace_id: workspaceId } });
    return res.data;
  }
};
