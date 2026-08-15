// ─── Global Type Definitions ───────────────────────────────────────────────────
// These types are shared across the entire frontend application.

// ─── API Response Wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  code: string;
  timestamp: string;
  request_id: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── User & Auth ───────────────────────────────────────────────────────────────
export type UserRole = "owner" | "org_admin" | "manager" | "analyst" | "viewer";

export type AccountType = "individual" | "organization";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_type: AccountType;
  tenant_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_owner: boolean;
  is_email_verified: boolean;
  tenant?: any;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

// ─── Organization & Workspace ──────────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  timezone: string;
  currency: string;
  plan: SubscriptionPlan;
  created_at: string;
}

export interface Workspace {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Dataset ───────────────────────────────────────────────────────────────────
export type DatasetStatus =
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

export type DatasetFileType = "csv" | "xlsx" | "json";

export interface Dataset {
  id: string;
  workspace_id: string;
  name: string;
  file_type: DatasetFileType;
  file_size_bytes: number;
  row_count?: number;
  column_count?: number;
  status: DatasetStatus;
  storage_path: string;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatasetColumn {
  name: string;
  dtype: string;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  std?: number;
}

// ─── AI Jobs ───────────────────────────────────────────────────────────────────
export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout"
  | "retrying";

export type JobType =
  | "dataset_analysis"
  | "excel_generation"
  | "report_generation"
  | "forecasting"
  | "ml_training";

export interface AIJob {
  id: string;
  job_type: JobType;
  status: JobStatus;
  progress: number; // 0-100
  dataset_id?: string;
  result_url?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export interface Dashboard {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  layout: DashboardWidget[];
  is_public: boolean;
  public_token?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  type: "kpi_card" | "bar_chart" | "line_chart" | "pie_chart" | "table" | "area_chart" | "scatter" | "gauge";
  title: string;
  dataset_id: string;
  query_config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

// ─── Billing ───────────────────────────────────────────────────────────────────
export type SubscriptionPlan = "starter" | "professional" | "enterprise" | "custom";

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: "active" | "past_due" | "cancelled" | "trialing";
  current_period_end: string;
  ai_tokens_used: number;
  ai_tokens_limit: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

// ─── Notification ──────────────────────────────────────────────────────────────
export type NotificationType =
  | "job_completed"
  | "job_failed"
  | "quota_warning"
  | "billing_alert"
  | "anomaly_detected"
  | "report_approved"
  | "report_rejected"
  | "member_invited";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}
