import api from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  model: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: string;
  result: Record<string, any> | null;
}

export class AIService {
  /**
   * Send a chat message to the AI Copilot.
   */
  static async chat(
    question: string,
    datasetId: string,
    history: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await api.post("/ai/chat", {
      question,
      dataset_id: datasetId,
      history,
    });
    return response.data;
  }

  /**
   * Trigger a deep analysis job.
   */
  static async analyze(
    datasetId: string,
    analysisType: string = "general"
  ): Promise<{ job_id: string; status: string; message: string }> {
    const response = await api.post("/ai/analyze", {
      dataset_id: datasetId,
      analysis_type: analysisType,
    });
    return response.data;
  }

  /**
   * Check the status of an async Celery task (like deep analysis).
   */
  static async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await api.get(`/ai/jobs/${jobId}`);
    return response.data;
  }
}
