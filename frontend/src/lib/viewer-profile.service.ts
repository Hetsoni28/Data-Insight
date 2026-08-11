import api from "./api";

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ViewerProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_name: string | null;
  organization_logo: string | null;
  department: string | null;
  job_title: string | null;
  role: string;
  account_type: string;
  account_status: string;
  member_since: string;
  last_active: string | null;
  phone: string | null;
  location: string | null;
  short_bio: string | null;
  is_email_verified: boolean;
  mfa_enabled: boolean;
  security_score: number;
  profile_completion: number;
}

export interface ViewerProfileUpdate {
  full_name?: string;
  phone?: string;
  location?: string;
  job_title?: string;
  department?: string;
  short_bio?: string;
}

export interface ViewerSecurityOverview {
  password_last_changed: string;
  mfa_enabled: boolean;
  active_sessions_count: number;
  failed_login_attempts: number;
  last_login: string | null;
  security_score: number;
  is_email_verified: boolean;
}

export interface ViewerPasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ViewerSession {
  id: string;
  device_name: string | null;
  os: string | null;
  browser: string | null;
  location: string | null;
  ip_address: string | null;
  is_active: boolean;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
}

export interface ViewerLoginHistoryEntry {
  id: string;
  ip_address: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  city: string;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

export interface ViewerLoginHistoryResponse {
  entries: ViewerLoginHistoryEntry[];
  total: number;
  page: number;
  size: number;
}

export interface ViewerNotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  report_ready: boolean;
  dataset_updated: boolean;
  dashboard_shared: boolean;
  ai_generation_complete: boolean;
  security_alerts: boolean;
  organization_announcements: boolean;
}

export interface ViewerPreferences {
  theme: string;
  density: string;
  reduced_motion: boolean;
  high_contrast: boolean;
  language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  number_format: string;
  currency_display: string;
  ai_response_style: string;
  ai_preferred_language: string;
  ai_show_suggestions: boolean;
  ai_show_explanations: boolean;
  ai_streaming: boolean;
  ai_conversation_history: boolean;
}

export interface ViewerActivityEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: string | null;
  created_at: string;
}

export interface ViewerActivityResponse {
  entries: ViewerActivityEntry[];
  total: number;
}

// ═══════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════

export const ViewerProfileService = {
  async getProfile(): Promise<ViewerProfile> {
    const res = await api.get("/viewer/profile");
    return res.data;
  },

  async updateProfile(data: ViewerProfileUpdate): Promise<ViewerProfile> {
    const res = await api.patch("/viewer/profile", data);
    return res.data;
  },

  async getSecurity(): Promise<ViewerSecurityOverview> {
    const res = await api.get("/viewer/profile/security");
    return res.data;
  },

  async changePassword(data: ViewerPasswordChange): Promise<{ success: boolean; message: string }> {
    const res = await api.post("/viewer/profile/password", data);
    return res.data;
  },

  async getSessions(): Promise<ViewerSession[]> {
    const res = await api.get("/viewer/profile/sessions");
    return res.data;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.post(`/viewer/profile/sessions/${sessionId}/revoke`);
  },

  async revokeAllSessions(): Promise<void> {
    await api.post("/viewer/profile/sessions/revoke-all");
  },

  async getLoginHistory(page = 1, size = 20): Promise<ViewerLoginHistoryResponse> {
    const res = await api.get("/viewer/profile/login-history", { params: { page, size } });
    return res.data;
  },

  async getNotificationPreferences(): Promise<ViewerNotificationPreferences> {
    const res = await api.get("/viewer/profile/notifications");
    return res.data;
  },

  async updateNotificationPreferences(data: Partial<ViewerNotificationPreferences>): Promise<ViewerNotificationPreferences> {
    const res = await api.patch("/viewer/profile/notifications", data);
    return res.data;
  },

  async getPreferences(): Promise<ViewerPreferences> {
    const res = await api.get("/viewer/profile/preferences");
    return res.data;
  },

  async updatePreferences(data: Partial<ViewerPreferences>): Promise<ViewerPreferences> {
    const res = await api.patch("/viewer/profile/preferences", data);
    return res.data;
  },

  async getActivity(): Promise<ViewerActivityResponse> {
    const res = await api.get("/viewer/profile/activity");
    return res.data;
  },

  async requestDataExport(): Promise<{ status: string; message: string; request_id: string }> {
    const res = await api.post("/viewer/profile/data-export");
    return res.data;
  },

  async requestAccountDeletion(): Promise<{ status: string; message: string }> {
    const res = await api.post("/viewer/profile/delete-request");
    return res.data;
  },
};
