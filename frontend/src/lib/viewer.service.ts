import api from "./api";

export interface ViewerWelcomeInfo {
  avatar_url: string | null;
  greeting: string;
  organization_name: string | null;
  department: string | null;
  role: string;
  workspace_name: string | null;
  workspace_id: string | null;
  today_date: string;
  recent_login: string | null;
}

export interface ViewerKpis {
  reports_shared: number;
  dashboards_available: number;
  datasets_available: number;
  reports_viewed_today: number;
  downloads_count: number;
  bookmarks_count: number;
  unread_notifications: number;
  recent_ai_conversations: number;
}

export interface ViewerDashboardOverview {
  welcome: ViewerWelcomeInfo;
  kpis: ViewerKpis;
  recent_activity: Record<string, any>[];
  unread_notifications: Record<string, any>[];
}

export interface ViewerReport {
  id: string;
  title: string;
  report_type: string;
  status: string;
  progress: number;
  output_url: string | null;
  output_size_bytes: number | null;
  created_at: string;
  updated_at: string;
  category: string;
  department: string;
  owner: string;
  is_bookmarked: boolean;
}

export interface ViewerReportListResponse {
  items: ViewerReport[];
  total: number;
  page: number;
  size: number;
}

export interface ViewerReportFiltersResponse {
  categories: string[];
  departments: string[];
  owners: string[];
  statuses: string[];
}

export interface ViewerReportInsights {
  executive_summary: string;
  key_findings: string[];
  trends: string[];
  anomalies: string[];
  risks: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface ViewerReportRelatedAsset {
  id: string;
  name: string;
  type: string;
}

export interface ViewerReportPreviewResponse {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  department: string;
  owner: string;
  created_at: string;
  updated_at: string;
  data_freshness: string;
  ai_generated: boolean;
  output_url: string | null;
  widgets: DashboardChartWidget[];
}

export interface DashboardChartWidget {
  id: string;
  type: "bar" | "line" | "pie" | "kpi";
  title: string;
  x_axis_key?: string;
  y_axis_key?: string;
  data: Record<string, any>[];
  metrics?: Record<string, any>;
}

export interface ViewerDashboard {
  id: string;
  name: string;
  description: string | null;
  dataset_id: string;
  dataset_name: string;
  department: string | null;
  created_at: string;
  updated_at: string;
  widgets: DashboardChartWidget[];
}

export interface ViewerDataset {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_size_bytes: number | null;
  status: string;
  row_count: number | null;
  column_count: number | null;
  data_quality_score: number | null;
  created_at: string;
  updated_at: string;
  owner: string;
  department: string;
  schema_info: Record<string, any>;
}

export interface ViewerAiChatRequest {
  question: string;
  dataset_id?: string;
  report_id?: string;
  history?: { role: string; content: string }[];
}

export interface ViewerAiChatResponse {
  answer: string;
  model: string;
}

export class ViewerService {
  static async getDashboardOverview(workspaceId: string): Promise<ViewerDashboardOverview> {
    const { data } = await api.get("/viewer/dashboard", { params: { workspace_id: workspaceId } });
    return data;
  }

  static async listReports(
    workspaceId: string,
    params?: {
      search?: string;
      category?: string;
      department?: string;
      status?: string;
      is_bookmarked?: boolean;
      page?: number;
      size?: number;
    }
  ): Promise<ViewerReportListResponse> {
    const { data } = await api.get("/viewer/reports", { 
      params: { workspace_id: workspaceId, ...params } 
    });
    return data;
  }

  static async getReportFilters(workspaceId: string): Promise<ViewerReportFiltersResponse> {
    const { data } = await api.get("/viewer/report-filters", { params: { workspace_id: workspaceId } });
    return data;
  }

  static async getReport(reportId: string): Promise<any> {
    const { data } = await api.get(`/viewer/reports/${reportId}`);
    return data;
  }

  static async getReportPreview(reportId: string): Promise<ViewerReportPreviewResponse> {
    const { data } = await api.get(`/viewer/reports/${reportId}/preview`);
    return data;
  }

  static async getReportInsights(reportId: string): Promise<ViewerReportInsights> {
    const { data } = await api.get(`/viewer/reports/${reportId}/insights`);
    return data;
  }

  static async getReportRelated(reportId: string): Promise<ViewerReportRelatedAsset[]> {
    const { data } = await api.get(`/viewer/reports/${reportId}/related`);
    return data;
  }

  static async listDashboards(workspaceId: string): Promise<ViewerDashboard[]> {
    const { data } = await api.get("/viewer/dashboards", { params: { workspace_id: workspaceId } });
    return data;
  }

  static async listDatasets(workspaceId: string): Promise<ViewerDataset[]> {
    const { data } = await api.get("/viewer/datasets", { params: { workspace_id: workspaceId } });
    return data;
  }

  static async getBookmarks(): Promise<string[]> {
    const { data } = await api.get("/viewer/bookmarks");
    return data;
  }

  static async toggleBookmark(reportId: string): Promise<{ report_id: string; is_bookmarked: boolean; message: string }> {
    const { data } = await api.post("/viewer/bookmarks/toggle", { report_id: reportId });
    return data;
  }

  static async chat(body: ViewerAiChatRequest): Promise<ViewerAiChatResponse> {
    const { data } = await api.post("/viewer/ai/chat", body);
    return data;
  }

  static async downloadReport(reportId: string): Promise<{ report_id: string; download_url: string; expires_in_seconds: number }> {
    const { data } = await api.post("/viewer/report/download", { report_id: reportId });
    return data;
  }

  static async getActivity(): Promise<any[]> {
    const { data } = await api.get("/profile/activity");
    return data;
  }

  static async getNotifications(): Promise<any[]> {
    const { data } = await api.get("/notifications");
    return data;
  }
}
