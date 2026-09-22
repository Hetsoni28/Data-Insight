import api, { API_BASE_URL } from "./api";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  artifact_data?: ArtifactData;
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

/** The typed artifact payload returned by the visual SQL agent. */
export interface ArtifactData {
  type: "chart" | "kpi" | "summary";
  chart_config?: ChartConfig;
  kpi_data?: KpiData;
  metadata?: Record<string, unknown>;
}

/** Recharts-compatible chart config returned inside an artifact. */
export interface ChartConfig {
  chart_type: "bar" | "line" | "area" | "pie" | "scatter";
  title?: string;
  x_key?: string;
  y_keys?: string[];
  data: Record<string, unknown>[];
  colors?: string[];
}

/** KPI card data returned inside an artifact. */
export interface KpiData {
  label: string;
  value: number | string;
  unit?: string;
  change?: number;
  trend?: "up" | "down" | "flat";
}

export interface ChatMessageItem {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  artifact_data?: ArtifactData | null;
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
  result: Record<string, unknown> | null;
}

/** Stored owner AI conversation session. */
export interface OwnerAISession {
  id: string;
  title?: string;
  messages: ChatMessage[];
  created_at: string;
}

/** Forecast result returned by /ai/forecast. */
export interface ForecastResult {
  forecast: Array<{
    ds: string;
    yhat: number;
    yhat_lower?: number;
    yhat_upper?: number;
  }>;
  model?: string;
  metrics?: Record<string, number>;
  target_column?: string;
  date_column?: string;
}

// ─── Streaming callback types ─────────────────────────────────────────────────

type OnChunk = (chunk: string) => void;
type OnDone = () => void;
type OnError = (err: unknown) => void;
type OnArtifact = (artifact: ArtifactData) => void;

// ─── AIService ────────────────────────────────────────────────────────────────

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
    onChunk?: OnChunk,
    onDone?: OnDone,
    onError?: OnError,
    sessionId?: string | null,
    onArtifact?: OnArtifact
  ) {
    const token = useAuthStore.getState().token ?? "";
    const { activeWs } = useWorkspaceStore.getState();

    // Use persistent session stream if session exists — persists history + visual SQL artifacts
    const url = sessionId
      ? `${API_BASE_URL}/ai/sessions/${sessionId}/messages/stream`
      : `${API_BASE_URL}/ai/chat/stream`;

    const body = sessionId
      ? JSON.stringify({ question, provider })
      : JSON.stringify({ question, dataset_id: datasetId || undefined, history, provider });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(activeWs?.id ? { "x-workspace-id": activeWs.id } : {})
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
            const data = JSON.parse(dataStr) as {
              type?: string;
              content?: string;
              artifact_data?: ArtifactData;
              token?: string;
              artifact?: ArtifactData;
              error?: string;
            };

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
          } catch {
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
   *
   * Backend: POST /owner/ai/chat — reads request.form() with fields:
   *   message (str), workspace_id (str), history (JSON str), session_id? (str), files? (list)
   * SSE format: data: {"chunk": "...", "type": "chunk"} | {"type": "done"}
   */
  static async ownerChatStream(
    question: string,
    history: ChatMessage[],
    model: string,
    onChunk: OnChunk,
    onDone: OnDone,
    onError: OnError
  ) {
    const token = useAuthStore.getState().token ?? "";
    const { activeWs } = useWorkspaceStore.getState();

    // Build multipart form-data — backend reads request.form(), not JSON body
    const formData = new FormData();
    formData.append("message", question);
    formData.append("workspace_id", activeWs?.id ?? "owner");
    formData.append("history", JSON.stringify(
      history.map(m => ({ role: m.role, content: m.content }))
    ));

    try {
      const response = await fetch(`${API_BASE_URL}/owner/ai/chat`, {
        method: "POST",
        headers: {
          // Do NOT set Content-Type — browser sets it with boundary for FormData
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
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
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              chunk?: string;
              type?: string;
              session_id?: string;
            };
            if (data.type === "chunk" && data.chunk) {
              onChunk(data.chunk);
            } else if (data.type === "done") {
              onDone();
              return;
            }
          } catch {
            // Ignore malformed SSE chunks
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
   * Auth header is injected automatically by the api.ts interceptor.
   */
  static async ownerAnalyze(
    file: File,
    question: string,
    model: string
  ): Promise<{ answer: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", question);
    formData.append("model", model);

    const response = await api.post("/owner/ai/analyze", formData);
    return response.data;
  }

  /**
   * Retrieve platform owner conversation history.
   */
  static async ownerGetHistory(): Promise<{ sessions: OwnerAISession[] }> {
    const response = await api.get("/owner/ai/history");
    return response.data;
  }

  /**
   * Save platform owner conversation history.
   */
  static async ownerSaveHistory(historyData: { sessions: OwnerAISession[] }): Promise<{ status: string }> {
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
  }): Promise<ForecastResult> {
    const response = await api.post("/ai/forecast", params);
    return response.data;
  }
}
