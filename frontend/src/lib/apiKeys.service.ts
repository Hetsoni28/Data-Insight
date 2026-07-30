import api from "@/lib/api";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  raw_key?: string; // Only returned on creation
}

export const ApiKeysService = {
  async getKeys(): Promise<ApiKey[]> {
    const { data } = await api.get("/users/me/api-keys");
    return data;
  },

  async createKey(name: string): Promise<ApiKey> {
    const { data } = await api.post("/users/me/api-keys", { name });
    return data;
  },

  async revokeKey(id: string): Promise<void> {
    await api.delete(`/users/me/api-keys/${id}`);
  }
};
