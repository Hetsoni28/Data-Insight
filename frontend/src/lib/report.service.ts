import api from "./api";

export interface Report {
  id: string;
  tenant_id: string;
  workspace_id: string;
  dataset_id: string;
  title: string;
  report_type: string;
  status: string;
  progress: number;
  output_url: string | null;
  celery_task_id: string | null;
  error_message: string | null;
  ai_tokens_used: number;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportJobResponse {
  id: string;
  status: string;
  progress: number;
  message: string;
}

export class ReportService {
  /**
   * Fetch all reports in a workspace.
   */
  static async list(workspaceId: string): Promise<Report[]> {
    const response = await api.get("/tenant-reports", {
      params: { workspace_id: workspaceId },
    });
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data?.data || [];
  }

  /**
   * Fetch paginated and filtered tenant reports.
   */
  static async listTenantReports(params: {
    search?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ data: Report[]; meta: { total: number; total_pages: number } }> {
    const response = await api.get("/tenant-reports", { params });
    const rawData = response.data;
    if (rawData && typeof rawData === "object") {
      const data = rawData.data || [];
      const meta = rawData.meta || {
        total: data.length,
        total_pages: Math.ceil(data.length / (params.limit || 10)),
      };
      return { data, meta };
    }
    return {
      data: Array.isArray(rawData) ? rawData : [],
      meta: { total: 0, total_pages: 0 },
    };
  }

  /**
   * Fetch a single report by its ID.
   */
  static async get(reportId: string): Promise<Report> {
    const response = await api.get(`/tenant-reports/${reportId}`);
    return response.data;
  }

  /**
   * Trigger the generation of a new report.
   */
  static async generate(
    datasetId: string,
    title: string,
    reportType: string = "excel",
    reportCategory: string = "executive",
    generationConfig?: Record<string, any>
  ): Promise<ReportJobResponse> {
    const response = await api.post("/tenant-reports/generate", {
      dataset_id: datasetId,
      title,
      report_type: reportType,
      report_category: reportCategory,
      generation_config: generationConfig,
    });
    return response.data;
  }

  /**
   * Delete a report by its ID.
   */
  static async delete(reportId: string): Promise<void> {
    await api.post(`/tenant-reports/${reportId}/action/delete`);
  }
}

export interface ReportSchedule {
  id: string;
  name: string;
  dataset_id: string;
  report_type: string;
  report_category: string;
  cron_expression: string;
  is_active: boolean;
  next_run_at: string;
  last_run_at: string | null;
  created_at: string;
}

export class ReportScheduleService {
  static async list(): Promise<ReportSchedule[]> {
    const response = await api.get("/tenant-reports/schedules");
    return response.data;
  }

  static async create(data: {
    name: string;
    dataset_id: string;
    report_type?: string;
    report_category?: string;
    cron_expression: string;
    export_format?: string;
    email_recipients?: string[];
  }): Promise<ReportSchedule> {
    const response = await api.post("/tenant-reports/schedules", data);
    return response.data;
  }

  static async toggle(scheduleId: string): Promise<ReportSchedule> {
    const response = await api.patch(`/tenant-reports/schedules/${scheduleId}/toggle`);
    return response.data;
  }

  static async delete(scheduleId: string): Promise<void> {
    await api.delete(`/tenant-reports/schedules/${scheduleId}`);
  }
}

