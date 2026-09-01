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

export class TenantDashboardService {
  static async getDashboardOverview(workspaceId: string): Promise<ViewerDashboardOverview> {
    try {
      const [overviewRes, kpiRes] = await Promise.all([
        api.get("/tenant-dashboard/overview", { params: { workspace_id: workspaceId } }),
        api.get("/tenant-dashboard/kpis", { params: { workspace_id: workspaceId } })
      ]);
      
      const overviewData = overviewRes.data?.data || {};
      const kpiData = kpiRes.data?.data || {};

      return {
        welcome: overviewData,
        kpis: {
          reports_shared: kpiData.reports?.total || 0,
          dashboards_available: kpiData.dashboards?.total || 0,
          datasets_available: kpiData.datasets?.total || 0,
          reports_viewed_today: kpiData.reports_viewed_today || 0,
          downloads_count: kpiData.downloads_count || 0,
          bookmarks_count: kpiData.bookmarks_count || 0,
          unread_notifications: 0,
          recent_ai_conversations: kpiData.ai_requests?.total || 0
        },
        recent_activity: overviewData.recent_activity || [],
        unread_notifications: overviewData.unread_notifications || []
      };
    } catch (error) {
      console.error("Error fetching overview:", error);
      return { welcome: {} as any, kpis: {} as any, recent_activity: [], unread_notifications: [] };
    }
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
    const { data } = await api.get("/tenant-reports", { 
      params: { workspace_id: workspaceId, ...params } 
    });
    // Backend returns { status, data: [...], meta: { total, page, limit } }
    return {
      items: data.data || [],
      total: data.meta?.total || 0,
      page: data.meta?.page || 1,
      size: data.meta?.limit || 50,
    };
  }

  static async getReportFilters(workspaceId: string): Promise<ViewerReportFiltersResponse> {
    // Return empty mock, as it's not supported by standard tenant API yet
    return { categories: [], departments: [], owners: [], statuses: [] };
  }

  static async getReport(reportId: string): Promise<any> {
    const { data } = await api.get(`/tenant-reports/${reportId}`);
    return data;
  }

  static async getReportPreview(reportId: string): Promise<ViewerReportPreviewResponse> {
    const { data } = await api.get(`/tenant-reports/${reportId}/preview`);
    return data.data;
  }

  static async getReportInsights(reportId: string): Promise<ViewerReportInsights> {
    const { data } = await api.get(`/tenant-reports/${reportId}/insights`);
    return data.data;
  }

  static async getReportRelated(reportId: string): Promise<ViewerReportRelatedAsset[]> {
    const { data } = await api.get(`/tenant-reports/${reportId}/related`);
    return data.data;
  }

  static async listDashboards(workspaceId: string): Promise<ViewerDashboard[]> {
    const { data } = await api.get("/tenant-dashboards", { params: { workspace_id: workspaceId } });
    // Backend returns an array directly
    return Array.isArray(data) ? data : [];
  }

  static async listDatasets(workspaceId: string): Promise<ViewerDataset[]> {
    const { data } = await api.get("/tenant-datasets", { params: { workspace_id: workspaceId } });
    return data.data || [];
  }

  static async getBookmarks(): Promise<string[]> {
    const { data } = await api.get("/tenant-reports/bookmarks");
    return data.data || [];
  }

  static async toggleBookmark(reportId: string): Promise<{ report_id: string; is_bookmarked: boolean; message: string }> {
    const { data } = await api.post(`/tenant-reports/${reportId}/bookmark`);
    return data.data;
  }

  static async chat(body: ViewerAiChatRequest): Promise<ViewerAiChatResponse> {
    const { data } = await api.post("/ai/chat", body);
    return data;
  }

  static async nlQuery(body: ViewerAiChatRequest): Promise<any> {
    const { data } = await api.post("/ai/nl-query", body);
    return data;
  }

  static async downloadReport(reportId: string): Promise<{ report_id: string; download_url: string; expires_in_seconds: number }> {
    const { data } = await api.get(`/tenant-reports/${reportId}/download`);
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
