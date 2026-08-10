import api from './api';

export interface DashboardOverview {
  organization_name: string;
  subscription_plan: string;
  subscription_status: string;
  platform_status: string;
  current_ai_provider: string;
  greeting: string;
}

export interface DashboardKPIs {
  active_users: number;
  datasets: { total: number; growth: number };
  reports: { total: number; growth: number };
  storage_mb: number;
  ai_requests: { total: number; growth: number };
  productivity_score: number;
  data_quality_score: number;
}

export interface DashboardChartData {
  date: string;
  full_date: string;
  ai_usage: number;
  reports: number;
  storage_mb: number;
}

export interface DashboardDataset {
  id: string;
  name: string;
  rows: number;
  columns: number;
  status: string;
  created_at: string;
}

export interface DashboardReport {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

export interface DashboardActivity {
  id: string;
  action: string;
  resource_type: string;
  status: string;
  created_at: string;
}

export const tenantDashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const res = await api.get('/tenant-dashboard/overview');
    return res.data.data;
  },
  getKpis: async (): Promise<DashboardKPIs> => {
    const res = await api.get('/tenant-dashboard/kpis');
    return res.data.data;
  },
  getCharts: async (): Promise<DashboardChartData[]> => {
    const res = await api.get('/tenant-dashboard/charts');
    return res.data.data;
  },
  getDatasets: async (skip = 0, limit = 5): Promise<DashboardDataset[]> => {
    const res = await api.get('/tenant-dashboard/datasets', { params: { skip, limit } });
    return res.data.data;
  },
  getReports: async (skip = 0, limit = 5): Promise<DashboardReport[]> => {
    const res = await api.get('/tenant-dashboard/reports', { params: { skip, limit } });
    return res.data.data;
  },
  getActivity: async (skip = 0, limit = 15): Promise<DashboardActivity[]> => {
    const res = await api.get('/tenant-dashboard/activity', { params: { skip, limit } });
    return res.data.data;
  },
};
