import api from "@/lib/api";

export interface Webhook {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
}

export const WebhooksService = {
  async getWebhooks(): Promise<Webhook[]> {
    const { data } = await api.get("/tenants/me/webhooks");
    return data;
  },

  async createWebhook(name: string, url: string, events: string[]): Promise<Webhook> {
    const { data } = await api.post("/tenants/me/webhooks", { name, url, events });
    return data;
  },

  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/tenants/me/webhooks/${id}`);
  }
};
