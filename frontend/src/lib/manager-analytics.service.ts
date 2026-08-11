import api from "./api";

export interface ManagerAnalyticsKpi {
  id: string;
  title: string;
  value: number;
  previous_value: number | null;
  change_pct: number;
  trend: "up" | "down" | "neutral";
  is_currency: boolean;
}

export interface ManagerAnalyticsTrendItem {
  date: string;
  value: number;
}

export interface ManagerAnalyticsTrend {
  id: string;
  title: string;
  metric: string;
  data: ManagerAnalyticsTrendItem[];
}

export interface ManagerAnalyticsPerformanceItem {
  id: string;
  name: string;
  value: number;
  contribution: number;
}

export interface ManagerAnalyticsPerformance {
  dimension: string;
  items: ManagerAnalyticsPerformanceItem[];
}

export interface ManagerAnalyticsAnomaly {
  id: string;
  metric: string;
  date: string;
  expected_value: number;
  actual_value: number;
  magnitude: number;
  severity: "high" | "medium" | "low";
  possible_explanation: string;
}

export interface ManagerAnalyticsDataQuality {
  dataset_id: string;
  dataset_name: string;
  completeness: number;
  missing_values: number;
  duplicate_records: number;
  quality_score: number;
}

export const ManagerAnalyticsService = {
  getKpis: async (datasetId: string): Promise<{ kpis: ManagerAnalyticsKpi[] }> => {
    const res = await api.get(`/manager/analytics/kpis`, { params: { dataset_id: datasetId } });
    return res.data;
  },

  getTrends: async (datasetId: string): Promise<{ trends: ManagerAnalyticsTrend[] }> => {
    const res = await api.get(`/manager/analytics/trends`, { params: { dataset_id: datasetId } });
    return res.data;
  },

  getPerformance: async (datasetId: string): Promise<{ performances: ManagerAnalyticsPerformance[] }> => {
    const res = await api.get(`/manager/analytics/performance`, { params: { dataset_id: datasetId } });
    return res.data;
  },

  getAnomalies: async (datasetId: string): Promise<{ anomalies: ManagerAnalyticsAnomaly[] }> => {
    const res = await api.get(`/manager/analytics/anomalies`, { params: { dataset_id: datasetId } });
    return res.data;
  },

  getDataQuality: async (datasetId: string): Promise<{ quality_reports: ManagerAnalyticsDataQuality[] }> => {
    const res = await api.get(`/manager/analytics/data-quality`, { params: { dataset_id: datasetId } });
    return res.data;
  }
};
