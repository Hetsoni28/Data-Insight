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
  page: number;
  size: number;
}

// ═══════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════

export const TenantProfileService = {
  async getProfile(): Promise<ViewerProfile> {
    const res = await api.get("/profile/me");
    const d = res.data?.data ?? res.data;
    const u = d?.user ?? d;
    const p = d?.profile ?? {};
    const stats = d?.stats ?? {};
    return {
      id: u?.id ?? "",
      email: u?.email ?? "",
      full_name: u?.full_name ?? p?.full_name ?? null,
      avatar_url: u?.avatar_url ?? p?.avatar_url ?? null,
      organization_name: u?.tenant?.name ?? null,
      organization_logo: u?.tenant?.logo_url ?? null,
      department: p?.department ?? null,
      job_title: p?.job_title ?? null,
      role: u?.role ?? "viewer",
      account_type: u?.account_type ?? "viewer",
      account_status: u?.account_status ?? "active",
      member_since: u?.created_at ?? new Date().toISOString(),
      last_active: u?.last_active_at ?? null,
      phone: p?.phone ?? null,
      location: p?.location ?? null,
      short_bio: p?.bio ?? null,
      is_email_verified: u?.is_email_verified ?? false,
      mfa_enabled: u?.mfa_enabled ?? false,
      security_score: u?.is_email_verified ? 50 : 0,
      profile_completion: stats?.profile_completion ?? 0,
    };
  },

  async updateProfile(data: ViewerProfileUpdate): Promise<ViewerProfile> {
    const res = await api.patch("/profile/me", data);
    return res.data?.data ?? res.data;
  },

  async getSecurity(): Promise<ViewerSecurityOverview> {
    const res = await api.get("/profile/me");
    const d = res.data?.data ?? res.data;
    const u = d?.user ?? d;
    const sessions = await api.get("/profile/sessions");
    const sessData = sessions.data?.data ?? sessions.data ?? [];
    const sessCount = Array.isArray(sessData) ? sessData.length : 0;
    return {
      password_last_changed: u?.password_changed_at ?? "Not available",
      mfa_enabled: u?.mfa_enabled ?? false,
      active_sessions_count: sessCount,
      failed_login_attempts: 0,
      last_login: u?.last_active_at ?? null,
      security_score: u?.is_email_verified ? (u?.mfa_enabled ? 100 : 50) : 0,
      is_email_verified: u?.is_email_verified ?? false,
    };
  },

  async changePassword(data: ViewerPasswordChange): Promise<{ success: boolean; message: string }> {
    const res = await api.post("/auth/change-password", data);
    return res.data?.data ?? res.data;
  },

  async getSessions(): Promise<ViewerSession[]> {
    const res = await api.get("/profile/sessions");
    const raw = res.data?.data ?? res.data ?? [];
    return Array.isArray(raw) ? raw.map((s: any) => ({
      id: s.id,
      device_name: s.device_name ?? null,
      os: s.os ?? null,
      browser: s.browser ?? null,
      location: s.location ?? null,
      ip_address: s.ip_address ?? null,
      is_active: s.is_active ?? true,
      is_current: s.is_current ?? false,
      last_active_at: s.last_active_at ?? s.created_at,
      created_at: s.created_at,
    })) : [];
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/profile/sessions/${sessionId}`);
  },

  async revokeAllSessions(): Promise<void> {
    await api.delete("/profile/sessions");
  },

  async getLoginHistory(page = 1, size = 20): Promise<ViewerLoginHistoryResponse> {
    const res = await api.get("/profile/audit", { params: { page, size } });
    const raw = res.data?.data ?? res.data ?? [];
    const entries = Array.isArray(raw) ? raw.map((e: any) => ({
      id: e.id,
      ip_address: e.ip_address ?? "Unknown",
      browser: e.browser ?? "Unknown",
      os: e.os ?? "Unknown",
      device: e.device_name ?? "Unknown",
      country: e.country ?? "Unknown",
      city: e.city ?? "Unknown",
      success: e.action !== "login_failed",
      failure_reason: e.action === "login_failed" ? e.details : null,
      created_at: e.created_at,
    })) : [];
    return { entries, total: entries.length, page, size };
  },

  async getNotificationPreferences(): Promise<ViewerNotificationPreferences> {
    const res = await api.get("/profile/me");
    const prefs = res.data?.data?.user?.preferences ?? res.data?.data?.preferences ?? {};
    return {
      email_notifications: prefs.email_notifications ?? true,
      push_notifications: prefs.push_notifications ?? false,
      report_ready: prefs.report_ready ?? true,
      dataset_updated: prefs.dataset_updated ?? true,
      dashboard_shared: prefs.dashboard_shared ?? true,
      ai_generation_complete: prefs.ai_generation_complete ?? true,
      security_alerts: prefs.security_alerts ?? true,
      organization_announcements: prefs.organization_announcements ?? true,
    };
  },

  async updateNotificationPreferences(data: Partial<ViewerNotificationPreferences>): Promise<ViewerNotificationPreferences> {
    const res = await api.patch("/profile/me", { preferences: data });
    return res.data?.data ?? res.data;
  },

  async getPreferences(): Promise<ViewerPreferences> {
    const res = await api.get("/profile/me");
    const prefs = res.data?.data?.user?.preferences ?? res.data?.data?.preferences ?? {};
    return {
      theme: prefs.theme ?? "system",
      density: prefs.density ?? "comfortable",
      reduced_motion: prefs.reduced_motion ?? false,
      high_contrast: prefs.high_contrast ?? false,
      language: prefs.language ?? "en",
      timezone: prefs.timezone ?? "UTC",
      date_format: prefs.date_format ?? "MM/DD/YYYY",
      time_format: prefs.time_format ?? "12h",
      number_format: prefs.number_format ?? "1,234.56",
      currency_display: prefs.currency_display ?? "symbol",
      ai_response_style: prefs.ai_response_style ?? "balanced",
      ai_preferred_language: prefs.ai_preferred_language ?? "en",
      ai_show_suggestions: prefs.ai_show_suggestions ?? true,
      ai_show_explanations: prefs.ai_show_explanations ?? true,
      ai_streaming: prefs.ai_streaming ?? true,
      ai_conversation_history: prefs.ai_conversation_history ?? true,
    };
  },

  async updatePreferences(data: Partial<ViewerPreferences>): Promise<ViewerPreferences> {
    const res = await api.patch("/profile/me", { preferences: data });
    return res.data?.data ?? res.data;
  },

  async getActivity(page = 1, size = 10): Promise<ViewerActivityResponse> {
    const res = await api.get("/profile/activity", { params: { page, size } });
    const raw = res.data?.data ?? res.data ?? [];
    const entries = Array.isArray(raw) ? raw.map((e: any) => ({
      id: e.id,
      action: e.action ?? e.activity_type ?? "action",
      resource_type: e.resource_type ?? null,
      resource_id: e.resource_id ?? null,
      details: e.details ?? e.description ?? null,
      created_at: e.created_at,
    })) : [];
    return { entries, total: entries.length, page, size };
  },

  async requestDataExport(): Promise<{ status: string; message: string; request_id: string }> {
    const res = await api.post("/profile/data-export");
    return res.data?.data ?? res.data;
  },

  async requestAccountDeletion(): Promise<{ status: string; message: string }> {
    const res = await api.post("/profile/delete-request");
    return res.data?.data ?? res.data;
  },
};

