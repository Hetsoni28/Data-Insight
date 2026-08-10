import api from "./api";

export interface UserProfile {
  id: string;
  user_id: string;
  phone?: string;
  alternate_email?: string;
  birth_date?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone: string;
  language: string;
  short_bio?: string;
  company_name?: string;
  job_title?: string;
  department?: string;
  industry?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  portfolio_url?: string;
  experience_years?: number;
  preferences?: Record<string, any>;
  security_settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProfileStats {
  organizations_created: number;
  users_managed: number;
  reports_generated: number;
  datasets_uploaded: number;
  ai_requests: number;
  api_calls: number;
  storage_used_mb: number;
  profile_completion_percentage: number;
  security_score: number;
}

export interface UserSession {
  id: string;
  device_name?: string;
  os?: string;
  browser?: string;
  location?: string;
  ip_address?: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  module: string;
  metadata_json?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  actor_user_id?: string;
  extra_metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: string;
  created_at: string;
}

export interface FullProfile {
  user: any;
  profile: UserProfile | null;
  stats: ProfileStats;
}

export const ProfileService = {
  async getFullProfile(): Promise<FullProfile> {
    const { data } = await api.get("/profile/me");
    return data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await api.patch("/profile/me", updates);
    return data;
  },

  async getSessions(): Promise<UserSession[]> {
    const { data } = await api.get("/profile/sessions");
    return data;
  },

  async terminateSession(id: string): Promise<void> {
    await api.delete(`/profile/sessions/${id}`);
  },

  async terminateAllOtherSessions(): Promise<void> {
    await api.delete("/profile/sessions");
  },

  async getActivity(): Promise<UserActivity[]> {
    const { data } = await api.get("/profile/activity");
    return data;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await api.get("/profile/audit");
    return data;
  },

  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  async removeAvatar(): Promise<{ message: string }> {
    const { data } = await api.delete("/profile/avatar");
    return data;
  }
};
