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
    const response = await api.get("/reports", {
      params: { workspace_id: workspaceId },
    });
    return response.data;
  }

  /**
   * Fetch a single report by its ID.
   */
  static async get(reportId: string): Promise<Report> {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  /**
   * Trigger the generation of a new report.
   */
  static async generate(
    datasetId: string,
    title: string,
    reportType: string = "excel",
    generationConfig?: Record<string, any>
  ): Promise<ReportJobResponse> {
    const response = await api.post("/reports/generate", {
      dataset_id: datasetId,
      title,
      report_type: reportType,
      generation_config: generationConfig,
    });
    return response.data;
  }

  /**
   * Delete a report by its ID.
   */
  static async delete(reportId: string): Promise<void> {
    await api.delete(`/reports/${reportId}`);
  }
}
