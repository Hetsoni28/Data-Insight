/**
 * Billing Service — typed API client for Organization Billing & Resource Rental.
 * Centralizes all billing API calls with proper TypeScript interfaces.
 * Uses the shared axios api instance for auth + tenant context.
 */
import api from "@/lib/api"

// ── Types ────────────────────────────────────────────────────────────────────

export interface BillingSummary {
  plan: string
  subscription_status: string
  billing_cycle: string
  currency: string
  current_period_end: string | null
  cancel_at: string | null
  mrr: number
  contract_number?: string
  contract_type?: string
  annual_contract_value?: number
  contracted_annual_amount?: number
  trial_ends_at: string | null
  seats_purchased: number
  has_stripe_subscription: boolean
  dedicated_db: boolean
  dedicated_db_url?: string | null
}

export interface UsageMeterData {
  used: number
  limit: number | null
  pct: number
  remaining: number | null
  warningState: "normal" | "warning" | "high" | "critical" | "limit"
}

export interface BillingUsage {
  members: UsageMeterData
  storage: UsageMeterData
  aiTokens: UsageMeterData
  datasets: UsageMeterData
  reports: UsageMeterData
  dashboards: UsageMeterData
}

export interface RentalContractData {
  id: string
  contract_number: string
  contract_type: string
  status: string
  start_date: string
  end_date: string | null
  renewal_date: string | null
  billing_cycle: string
  base_price_monthly: number
  annual_contract_value: number
  annual_discount: number
  contracted_annual_amount: number
  currency: string
  payment_terms: string
  support_tier: string
  sla_guarantee: string
  deployment_model: string
  document_url: string | null
  notes: string | null
}

export interface RentedResourcesData {
  database: {
    engine: string
    tier: string
    status: string
    allocated_gb: number
    used_gb: number
    region: string
    backups_enabled: boolean
    backup_retention_days: number
    dedicated_vpc: boolean
    max_connections: number
    connection_pooling: string
  }
  storage: {
    allocated_gb: number
    used_gb: number
    used_bytes: number
    files_count: number
    datasets_count: number
    reports_count: number
    backup_snapshots_count: number
    redundancy: string
    encryption: string
  }
  ai_processing: {
    monthly_quota_tokens: number
    used_tokens: number
    total_requests: number
    models_available: string[]
    features_breakdown: Record<string, { tokens: number; prompt: number; completion: number; requests: number }>
  }
  compute: {
    tier: string
    status: string
    auto_scaling: boolean
    max_workers: number
    task_queue: string
  }
  backup_recovery: {
    automated_daily: boolean
    point_in_time_recovery: boolean
    rpo: string
    rto: string
    last_snapshot_at: string
  }
}

export interface CostBreakdownData {
  currency: string
  billing_cycle: string
  base_rental_fee: number
  storage_allocation_gb: number
  storage_used_gb: number
  storage_overage_gb: number
  storage_overage_fee: number
  ai_token_allocation: number
  ai_tokens_used: number
  ai_overage_tokens: number
  ai_overage_fee: number
  backup_infrastructure_fee: number
  dedicated_support_fee: number
  subtotal: number
  discount: number
  tax: number
  total_due: number
  billing_period_start: string
  billing_period_end: string
  payment_status: string
  payment_terms: string
}

export interface ResourceRequestItem {
  id: string
  resource_type: string
  requested_capacity: string
  current_capacity: string | null
  business_reason: string
  status: "submitted" | "under_review" | "approved" | "rejected" | "provisioning" | "completed" | "cancelled"
  approved_capacity: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface CreateResourceRequestPayload {
  resource_type: "storage" | "database" | "ai_tokens" | "compute" | "backup" | "custom"
  requested_capacity: string
  current_capacity?: string
  business_reason: string
}

export interface PlanFeature {
  id: string
  name: string
  description?: string
  price: number | null
  price_monthly?: number | null
  billing: string
  billing_monthly?: string
  features: string[]
  limits: { users: number | null; ai_tokens: number | null; storage_gb: number | null }
  highlighted: boolean
}

export interface PlanCatalog {
  currentPlan: string
  plans: PlanFeature[]
}

export interface InvoiceItem {
  id: string
  stripeInvoiceId: string
  amount: number
  currency: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  periodStart: string | null
  periodEnd: string | null
  invoiceDate: string | null
}

export interface InvoicePage {
  items: InvoiceItem[]
  total: number
  page: number
  pages: number
}

export interface PaymentItem {
  id: string
  eventType: string
  description: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface PaymentPage {
  items: PaymentItem[]
  total: number
  page: number
  pages: number
}

export interface Entitlements {
  features: Record<string, boolean>
  limits: Record<string, number | null>
}

// ── Service ──────────────────────────────────────────────────────────────────

export const billingService = {
  async getSummary(): Promise<BillingSummary> {
    const res = await api.get<BillingSummary>("/org/billing/summary")
    return res.data
  },

  async getContract(): Promise<RentalContractData> {
    const res = await api.get<RentalContractData>("/org/billing/contract")
    return res.data
  },

  async getResources(): Promise<RentedResourcesData> {
    const res = await api.get<RentedResourcesData>("/org/billing/resources")
    return res.data
  },

  async getCosts(): Promise<CostBreakdownData> {
    const res = await api.get<CostBreakdownData>("/org/billing/costs")
    return res.data
  },

  async getResourceRequests(): Promise<ResourceRequestItem[]> {
    const res = await api.get<ResourceRequestItem[]>("/org/billing/resource-requests")
    return res.data
  },

  async createResourceRequest(payload: CreateResourceRequestPayload): Promise<any> {
    const res = await api.post("/org/billing/resource-requests", payload)
    return res.data
  },

  async getUsage(): Promise<BillingUsage> {
    const res = await api.get<BillingUsage>("/org/billing/usage")
    return res.data
  },

  async getPlans(): Promise<PlanCatalog> {
    const res = await api.get<PlanCatalog>("/org/billing/plans")
    return res.data
  },

  async getInvoices(page = 1, limit = 10): Promise<InvoicePage> {
    const res = await api.get<InvoicePage>(`/org/billing/invoices?page=${page}&limit=${limit}`)
    return res.data
  },

  async getInvoicePdf(invoiceId: string): Promise<{ pdfUrl: string }> {
    const res = await api.get<{ pdfUrl: string }>(`/org/billing/invoices/${invoiceId}`)
    return res.data
  },

  async payInvoice(invoiceId: string): Promise<{ checkout_url: string }> {
    const res = await api.post<{ checkout_url: string }>(`/org/billing/invoices/${invoiceId}/pay`)
    return res.data
  },

  async getPayments(page = 1): Promise<PaymentPage> {
    const res = await api.get<PaymentPage>(`/org/billing/payments?page=${page}`)
    return res.data
  },

  async getEntitlements(): Promise<Entitlements> {
    const res = await api.get<Entitlements>("/org/billing/entitlements")
    return res.data
  },

  async openPortal(): Promise<{ portal_url: string }> {
    const res = await api.post<{ portal_url: string }>("/org/billing/portal")
    return res.data
  },

  async startCheckout(plan: string): Promise<{ checkout_url: string }> {
    const res = await api.post<{ checkout_url: string }>("/org/billing/checkout", { plan })
    return res.data
  },

  async validateCoupon(code: string): Promise<{ valid: boolean; discount_pct: number | null; description: string | null }> {
    const res = await api.post("/org/billing/coupon/validate", { code })
    return res.data
  },

  async requestCancellation(reason: string): Promise<{ status: string }> {
    const res = await api.post("/org/billing/cancel", { reason })
    return res.data
  },

  async reactivate(): Promise<{ status: string }> {
    const res = await api.post("/org/billing/reactivate")
    return res.data
  },
}
