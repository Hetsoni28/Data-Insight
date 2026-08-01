import api from "@/lib/api";

export interface IntegrationKPIs {
  total_connections: number;
  online_connections: number;
  offline_connections: number;
  global_health_score: number;
  total_syncs_30d: number;
  failed_syncs_30d: number;
  avg_latency_ms: number;
  active_webhooks: number;
}

export interface IntegrationConnection {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: "online" | "degraded" | "offline" | "maintenance";
  health_score: number;
  auth_type: string;
  latency_ms: number;
  error_rate: number;
  is_active: boolean;
  last_sync_at: string | null;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  latency_ms: number;
  success_rate: number;
  retries: number;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, any>;
  actions: Record<string, any>[];
  status: string;
  success_rate: number;
  execution_count: number;
  is_active: boolean;
  last_executed_at: string | null;
}

export interface IntegrationLog {
  id: string;
  provider: string;
  request_method: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  timestamp: string;
}

export const getIntegrationOverview = async (): Promise<{ kpis: IntegrationKPIs }> => {
  const { data } = await api.get("/owner/integrations/overview");
  return data;
};

export const getConnectedIntegrations = async (): Promise<{ integrations: IntegrationConnection[] }> => {
  const { data } = await api.get("/owner/integrations/connected");
  return data;
};

export const getWebhooks = async (): Promise<{ webhooks: WebhookEndpoint[] }> => {
  const { data } = await api.get("/owner/integrations/webhooks");
  return data;
};

export const getWorkflows = async (): Promise<{ workflows: AutomationWorkflow[] }> => {
  const { data } = await api.get("/owner/integrations/workflows");
  return data;
};

export const getIntegrationLogs = async (): Promise<{ logs: IntegrationLog[] }> => {
  const { data } = await api.get("/owner/integrations/logs?limit=100");
  return data;
};
