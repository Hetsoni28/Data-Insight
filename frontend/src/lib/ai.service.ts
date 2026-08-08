import api from "./api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  artifact_data?: any;
}

export interface ChatSessionItem {
  id: string;
  tenant_id: string;
  user_id: string;
  dataset_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessageItem[];
  dataset?: {
    id: string;
    name: string;
    row_count?: number;
    column_count?: number;
  };
}

export interface ChatMessageItem {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  artifact_data?: {
    type: "chart" | "kpi" | "summary";
    chart_config?: any;
    kpi_data?: any;
    metadata?: any;
  } | null;
  created_at: string;
}

export interface SuggestionItem {
  question: string;
  intent?: string;
  expected_chart?: string;
  category?: string;
  icon?: string;
  title?: string;
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
   * Fetch all chat sessions for the current workspace / dataset.
   */
  static async getSessions(datasetId?: string, limit = 50, offset = 0): Promise<{ sessions: ChatSessionItem[]; total: number }> {
    const params = new URLSearchParams();
    if (datasetId) params.append("dataset_id", datasetId);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    const res = await api.get(`/ai/sessions?${params.toString()}`);
    return res.data;
  }

  /**
   * Create a new persistent chat session.
   */
  static async createSession(data: { title?: string; dataset_id?: string }): Promise<ChatSessionItem> {
    const res = await api.post("/ai/sessions", data);
    return res.data;
  }

  /**
   * Get a specific chat session with its full message history.
   */
  static async getSession(sessionId: string): Promise<ChatSessionItem> {
    const res = await api.get(`/ai/sessions/${sessionId}`);
    return res.data;
  }

  /**
   * Update / rename a chat session.
   */
  static async updateSession(sessionId: string, data: { title: string }): Promise<ChatSessionItem> {
    const res = await api.patch(`/ai/sessions/${sessionId}`, data);
    return res.data;
  }

  /**
   * Delete a chat session.
   */
  static async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/ai/sessions/${sessionId}`);
  }

  /**
   * Fetch dynamic contextual suggestions for a dataset.
   */
  static async getSuggestions(datasetId: string): Promise<SuggestionItem[]> {
    const res = await api.get(`/ai/suggestions/${datasetId}`);
    return res.data?.suggestions || [];
  }

  /**
   * Send a chat message to the AI Copilot.
   */
  static async chat(
    question: string,
    datasetId?: string,
    sessionId?: string,
    history: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const response = await api.post("/ai/chat", {
      question,
      dataset_id: datasetId,
      session_id: sessionId,
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
   * Stream a chat response from the AI Copilot.
   * If sessionId is provided, uses the persistent session stream endpoint
   * which saves messages, runs visual SQL agent, and returns chart artifacts.
   * Otherwise falls back to the stateless /ai/chat/stream endpoint.
   */
  static async copilotChatStream(
    question: string,
    datasetId?: string | null,
    history: ChatMessage[] = [],
    provider = "groq",
    onChunk?: (chunk: string) => void,
    onDone?: () => void,
    onError?: (err: any) => void,
    sessionId?: string | null,
    onArtifact?: (artifact: any) => void
  ) {
    const token = localStorage.getItem("access_token");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

    // Use persistent session stream if session exists — persists history + visual SQL artifacts
    const url = sessionId
      ? `${baseUrl}/ai/sessions/${sessionId}/messages/stream`
      : `${baseUrl}/ai/chat/stream`;

    const body = sessionId
      ? JSON.stringify({ question, provider })
      : JSON.stringify({ question, dataset_id: datasetId || undefined, history, provider });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) throw new Error("No response body");

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
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") {
            onDone?.();
            return;
          }
          try {
            const data = JSON.parse(dataStr);

            // Session stream format: { type: "token"|"artifact"|"done"|"meta", content, artifact_data }
            if (data.type === "token" && data.content && onChunk) {
              onChunk(data.content);
            } else if (data.type === "artifact" && data.artifact_data && onArtifact) {
              onArtifact(data.artifact_data);
            } else if (data.type === "done") {
              onDone?.();
              return;
            }

            // Stateless stream format: { token, artifact, error }
            if (data.token && onChunk) onChunk(data.token);
            if (data.artifact && onArtifact) onArtifact(data.artifact);
            if (data.error) throw new Error(data.error);
          } catch (e) {
            // Ignore JSON parse errors for partial chunks
          }
        }
      }
      onDone?.();
    } catch (error) {
      if (onError) onError(error);
    }
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

  /**
   * Run real Machine Learning time-series forecasting on a dataset.
   */
  static async generateForecast(params: {
    dataset_id: string;
    horizon?: number;
    target_column?: string;
    date_column?: string;
    confidence_level?: number;
  }): Promise<any> {
    const response = await api.post("/ai/forecast", params);
    return response.data;
  }
}

