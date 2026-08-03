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

  /**
   * Stream a chat response from Gemini with owner platform context.
   */
  static async ownerChatStream(
    question: string,
    history: ChatMessage[],
    model: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    const token = localStorage.getItem("access_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    
    try {
      const response = await fetch(`${baseUrl}/owner/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question, history, model })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                onChunk(data.chunk);
              }
            } catch (e) {
              console.error("Error parsing stream line:", e);
            }
          }
        }
      }
      onDone();
    } catch (error) {
      onError(error);
    }
  }

  /**
   * Upload a file for multimodal owner AI analysis.
   */
  static async ownerAnalyze(
    file: File,
    question: string,
    model: string
  ): Promise<{ answer: string }> {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", question);
    formData.append("model", model);

    const response = await api.post("/owner/ai/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`
      }
    });
    return response.data;
  }

  /**
   * Retrieve platform owner conversation history.
   */
  static async ownerGetHistory(): Promise<{ sessions: any[] }> {
    const response = await api.get("/owner/ai/history");
    return response.data;
  }

  /**
   * Save platform owner conversation history.
   */
  static async ownerSaveHistory(historyData: { sessions: any[] }): Promise<{ status: string }> {
    const response = await api.post("/owner/ai/history", historyData);
    return response.data;
  }
}

