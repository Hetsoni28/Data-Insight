import api from "@/lib/api";

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  logo_url?: string;
  industry?: string;
  timezone: string;
  currency: string;
  plan: string;
  max_users: number;
  max_storage_gb: number;
  max_ai_tokens_per_month: number;
  white_label_config: Record<string, any> | null;
  sso_config: Record<string, any> | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
  is_active: boolean;
  created_at: string;
}

export const TenantService = {
  /** GET /tenants/me → returns the current tenant */
  getMe: async (): Promise<Tenant> => {
    const { data } = await api.get<Tenant>("/tenants/me");
    return data;
  },

  /** PATCH /tenants/me → updates the current tenant */
  updateMe: async (updates: Partial<Tenant>): Promise<Tenant> => {
    const { data } = await api.patch<Tenant>("/tenants/me", updates);
    return data;
  },
};
