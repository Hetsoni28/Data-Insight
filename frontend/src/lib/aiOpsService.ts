import api from "./api";

// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface AIOpsKPIs {
  connected_providers: number;
  online_providers: number;
  available_models: number;
  avg_health_score: number;
  monthly_requests: number;
  monthly_tokens: number;
  monthly_cost_usd: number;
  avg_cost_per_req: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface AIProvider {
  id: string;
  name: string;
  base_url: string;
  status: "online" | "offline" | "degraded" | "maintenance";
  health_score: number;
  latency_ms: number;
  is_active: boolean;
  environment: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: string;
  context_window: number;
  input_cost: number;
  output_cost: number;
  quality_score: number;
  is_active: boolean;
}

export interface AIRoutingRule {
  id: string;
  task_type: string;
  primary_model: string;
  fallback_model: string;
  timeout_ms: number;
  retry_count: number;
  is_active: boolean;
}

export interface AITimeseriesData {
  date: string;
  requests: number;
  cost: number;
}

// ─── API CALLS ─────────────────────────────────────────────────────────────

export const getAIOpsOverview = async (): Promise<{ kpis: AIOpsKPIs }> => {
  const { data } = await api.get("/owner/ai/overview");
  return data;
};

export const getAIProviders = async (): Promise<{ providers: AIProvider[] }> => {
  const { data } = await api.get("/owner/ai/providers");
  return data;
};

export const getAIModels = async (): Promise<{ models: AIModel[] }> => {
  const { data } = await api.get("/owner/ai/models");
  return data;
};

export const getAIRoutingRules = async (): Promise<{ rules: AIRoutingRule[] }> => {
  const { data } = await api.get("/owner/ai/routing");
  return data;
};

export const getAIUsageTimeseries = async (days = 7): Promise<{ timeseries: AITimeseriesData[] }> => {
  const { data } = await api.get(`/owner/ai/usage/timeseries?days=${days}`);
  return data;
};
