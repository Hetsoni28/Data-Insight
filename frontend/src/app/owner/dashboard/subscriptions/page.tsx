"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Download, RefreshCw, Loader2,
  DollarSign, Users, TrendingUp, CreditCard,
  Activity, ShieldCheck, Server, Building2,
  Check, AlertTriangle, BarChart3, FileText,
  History, Zap, ArrowRight, Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"
import { SubscriptionAnalyticsCharts } from "@/components/organisms/SubscriptionAnalyticsCharts"
import { SubscriptionDataGrid } from "@/components/organisms/SubscriptionDataGrid"

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, sub, color }: { title: string; value: string; icon: any; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm flex items-start gap-4"
    >
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

// ─── Plan Tier Card ──────────────────────────────────────────────────────────
function PlanCard({
  title, description, icon: Icon, price, priceSub, features,
  isFeatured, actionLabel, onAction, badgeLabel
}: {
  title: string; description: string; icon: any; price: string; priceSub: string;
  features: string[]; isFeatured?: boolean; actionLabel: string; onAction: () => void; badgeLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`p-7 rounded-2xl flex flex-col justify-between space-y-6 relative transition-all ${
        isFeatured
          ? "bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl hover:shadow-2xl hover:border-slate-300 dark:hover:border-white/20"
      }`}
    >
      {badgeLabel && (
        <div className="absolute top-5 right-5">
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full">
            {badgeLabel}
          </span>
        </div>
      )}
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            isFeatured ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{price}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{priceSub}</span>
          </div>
        </div>

        <ul className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={onAction}
        className={`w-full rounded-xl font-bold text-sm h-11 ${
          isFeatured
            ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900"
        }`}
      >
        {actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  )
}

// ─── Invoices Table ───────────────────────────────────────────────────────────
function InvoicesTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-invoices'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/invoices?skip=0&limit=20')
      return res.data?.data ?? []
    }
  })

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>

  const invoices: any[] = Array.isArray(data) ? data : []

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No invoices found</p>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold">Organization</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{inv.tenant_name}</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                  {inv.currency || "$"}{Number(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <Badge className={`text-[10px] font-bold uppercase ${statusColor[inv.status] || "bg-slate-100 text-slate-600"}`}>
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                  {inv.date ? new Date(inv.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-billing-activity'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/activity')
      return res.data?.data ?? []
    }
  })

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>

  const activities: any[] = Array.isArray(data) ? data : []

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <History className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No billing activity yet</p>
      </div>
    )
  }

  const typeColor: Record<string, string> = {
    subscription_updated: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    subscription_canceled: "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
    payment_received: "bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400",
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-white/5">
      {activities.map((act: any) => (
        <div key={act.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
          <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${typeColor[act.type] || "bg-slate-100 text-slate-600"}`}>
            {act.type?.replace(/_/g, " ")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{act.tenant}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.description}</p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
            {act.date ? new Date(act.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgId, setNewOrgId] = useState("")
  const [newPlan, setNewPlan] = useState("professional")
  const queryClient = useQueryClient()

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const { data: kpis, isLoading: isKpisLoading, refetch: refetchKpis } = useQuery({
    queryKey: ['owner-subscriptions-kpis'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/kpis')
      return res.data
    }
  })

  // ── Trends ────────────────────────────────────────────────────────────────
  const { data: trends, isLoading: isTrendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['owner-subscriptions-trends'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/revenue-trends')
      return res.data
    }
  })

  // ── Org List ──────────────────────────────────────────────────────────────
  const { data: subscriptionsData, isLoading: isSubscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['owner-subscriptions-list'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/organizations?skip=0&limit=50')
      return Array.isArray(res.data?.data) ? res.data.data : []
    }
  })

  // ── Health ────────────────────────────────────────────────────────────────
  const { data: health } = useQuery({
    queryKey: ['owner-subscriptions-health'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/analytics/health')
      return res.data
    }
  })

  const handleRefresh = () => {
    refetchKpis(); refetchTrends(); refetchSubscriptions()
    queryClient.invalidateQueries({ queryKey: ['owner-invoices'] })
    queryClient.invalidateQueries({ queryKey: ['owner-billing-activity'] })
    toast.success("Dashboard refreshed.")
  }

  const handleExportCSV = async () => {
    toast.info("Generating Revenue CSV...")
    try {
      const { data } = await api.get("/owner/subscriptions/organizations?skip=0&limit=100")
      const rows = Array.isArray(data?.data) ? data.data : []
      if (rows.length === 0) { toast.error("No data to export."); return }
      const headers = ["ID", "Name", "Plan", "Status", "MRR", "Billing Cycle", "Users", "Storage (GB)", "Created At"]
      const csvRows = [headers.join(","), ...rows.map((t: any) =>
        [t.id, `"${t.name}"`, t.plan, t.status, t.mrr, t.billing_cycle, t.users, t.storage_used, t.created_at].join(",")
      )]
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url
      a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url)
      toast.success("Export complete.")
    } catch { toast.error("Failed to export.") }
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgId.trim()) { toast.error("Please enter an Organization ID."); return }
    setIsCreating(true)
    try {
      await api.post(`/owner/subscriptions/${newOrgId.trim()}/upgrade`, { plan: newPlan })
      toast.success(`Organization upgraded to ${newPlan} plan.`)
      setIsCreateOpen(false); setNewOrgId(""); setNewPlan("professional")
      refetchKpis(); refetchTrends(); refetchSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create subscription.")
    } finally { setIsCreating(false) }
  }

  // ── Computed KPI values ────────────────────────────────────────────────────
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const fmtUsd = (n: number) => `$${fmt(n)}`

  const mrr = kpis?.mrr ?? 0
  const arr = kpis?.arr ?? 0
  const totalRevenue = kpis?.total_revenue ?? 0
  const activeCount = kpis?.active_subscriptions ?? 0
  const arpu = kpis?.arpu ?? 0
  const churnRate = kpis?.churn_rate ?? 0
  const netProfit = kpis?.net_profit ?? 0
  const failedPayments = kpis?.failed_payments ?? 0

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 space-y-8 max-w-[1800px] mx-auto pb-20"
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <CreditCard className="h-6 w-6" />
            </div>
            Subscription Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Manage enterprise system rental contracts, organization billing, and platform revenue.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleRefresh}
            className="rounded-xl border-slate-200/80 dark:border-white/10 text-xs font-bold gap-2 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}
            className="rounded-xl border-slate-200/80 dark:border-white/10 text-xs font-bold gap-2">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 gap-2">
            <Plus className="h-3.5 w-3.5" /> New Subscription
          </Button>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c291e] via-[#133e2e] to-[#091e16] border border-emerald-500/30 shadow-2xl shadow-emerald-950/20"
      >
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 pointer-events-none">
          <div className="h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-1/4 translate-y-12 pointer-events-none">
          <div className="h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 p-7 md:p-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white shrink-0">
                  <DollarSign className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Platform Revenue Overview
                  </h2>
                  <p className="text-emerald-200/80 text-xs md:text-sm mt-0.5 font-medium flex items-center gap-2">
                    <span>Enterprise System Rental Billing Engine</span>
                    <span>•</span>
                    {health ? (
                      <span className={`font-bold flex items-center gap-1 ${health.score >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block ${health.score >= 80 ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {health.status}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Live
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Live Metric Chips */}
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { label: "MRR", value: isKpisLoading ? "—" : fmtUsd(mrr), icon: TrendingUp, color: "text-emerald-400" },
                  { label: "ARR", value: isKpisLoading ? "—" : fmtUsd(arr), icon: Activity, color: "text-teal-400" },
                  { label: "Total Collected", value: isKpisLoading ? "—" : fmtUsd(totalRevenue), icon: CreditCard, color: "text-sky-400" },
                  { label: "Net Profit", value: isKpisLoading ? "—" : fmtUsd(netProfit), icon: Zap, color: "text-violet-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                    <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                    <div>
                      <div className="text-[10px] text-emerald-200/70 font-medium uppercase tracking-wider">{label}</div>
                      <div className="text-lg font-black text-white leading-none mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Secondary Metrics */}
            <div className="grid grid-cols-2 gap-3 shrink-0 w-full lg:w-auto">
              {[
                { label: "Active Orgs", value: isKpisLoading ? "—" : String(activeCount), icon: Users },
                { label: "ARPU", value: isKpisLoading ? "—" : fmtUsd(arpu), icon: BarChart3 },
                { label: "Churn Rate", value: isKpisLoading ? "—" : `${churnRate}%`, icon: AlertTriangle },
                { label: "Failed Pmts", value: isKpisLoading ? "—" : fmtUsd(failedPayments), icon: ShieldCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Icon className="h-4 w-4 text-emerald-400/70 mx-auto mb-1" />
                  <div className="text-[10px] text-emerald-200/60 font-medium uppercase tracking-wider">{label}</div>
                  <div className="text-base font-black text-white mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl flex flex-wrap h-auto gap-1">
          {[
            { value: "plans", icon: Server, label: "Pricing Plans" },
            { value: "organizations", icon: Users, label: "Organizations", count: activeCount },
            { value: "analytics", icon: TrendingUp, label: "Revenue Analytics" },
            { value: "invoices", icon: FileText, label: "Invoices" },
            { value: "activity", icon: History, label: "Billing Activity" },
          ].map(({ value, icon: Icon, label, count }) => (
            <TabsTrigger key={value} value={value}
              className="rounded-xl text-xs md:text-sm font-extrabold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all px-4 py-2">
              <Icon className="h-4 w-4 mr-2" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500 text-white text-[10px] px-2 py-0.5 font-black">{count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Pricing Plans (from PricingSection style) */}
        <TabsContent value="plans" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 pb-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enterprise System Rental & <span className="text-emerald-600 dark:text-emerald-400">Dedicated Platform Licensing</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rent Data Insight as a turn-key private AI Business Intelligence infrastructure, or white-label it for enterprise clients.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <PlanCard
              title="Dedicated System Rental"
              description="Complete turn-key AI Business Intelligence system rental hosted in a dedicated, isolated single-tenant VPC."
              icon={Server}
              price="$15,000"
              priceSub="/ month (or $12,500/mo annual)"
              isFeatured
              badgeLabel="Most Popular"
              features={[
                "Dedicated single-tenant cloud deployment (AWS / GCP / Azure)",
                "Unlimited internal users, analysts & executive accounts",
                "Full white-labeling with custom domain (bi.yourcompany.com)",
                "Living multi-tab Excel spreadsheet compiler engine",
                "Autonomous 6-stage AI intelligence & anomaly cleansing pipeline",
                "Unlimited CSV, Excel, PostgreSQL, Snowflake & BigQuery connectors",
                "Zero data training retention & SOC2 Type II enterprise compliance",
                "99.99% Uptime SLA with 24/7 dedicated engineering support",
              ]}
              actionLabel="Create Subscription"
              onAction={() => { setNewPlan("professional"); setIsCreateOpen(true) }}
            />
            <PlanCard
              title="Custom Global License"
              description="For conglomerates, holding groups, and software providers wanting full platform whitelabel & resale rights."
              icon={Building2}
              price="Custom"
              priceSub="/ annual contract"
              features={[
                "On-premise air-gapped VPC or multi-region deployment",
                "Multi-tenant client sub-organizations & isolated workspaces",
                "Custom fine-tuned localized LLM adapters & ERP connectors (SAP/Oracle)",
                "Complete whitelabeling (custom CSS, logos, domains, and emails)",
                "Full source code audit, escrow guarantee & dedicated Solutions Architect",
                "Custom enterprise SLAs with dedicated 1-on-1 executive onboarding",
                "Tailored data retention & bespoke security policy enforcement",
              ]}
              actionLabel="Contact Sales"
              onAction={() => { window.location.href = "mailto:licensing@datainsight.com" }}
            />
          </div>

          {/* KPI Summary below plan cards */}
          {!isKpisLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
              <KpiCard title="Monthly Recurring Revenue" value={fmtUsd(mrr)} icon={TrendingUp} sub="From active orgs" color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
              <KpiCard title="Annual Run Rate" value={fmtUsd(arr)} icon={BarChart3} sub="Projected" color="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400" />
              <KpiCard title="Active Organizations" value={String(activeCount)} icon={Users} sub="Subscribed tenants" color="bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" />
              <KpiCard title="Avg. Revenue Per Org" value={fmtUsd(arpu)} icon={CreditCard} sub="Per active tenant" color="bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" />
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Organizations */}
        <TabsContent value="organizations">
          <SubscriptionDataGrid data={subscriptionsData} isLoading={isSubscriptionsLoading} />
        </TabsContent>

        {/* Tab 3: Revenue Analytics */}
        <TabsContent value="analytics">
          <SubscriptionAnalyticsCharts data={trends} isLoading={isTrendsLoading} />
        </TabsContent>

        {/* Tab 4: Invoices */}
        <TabsContent value="invoices">
          <InvoicesTable />
        </TabsContent>

        {/* Tab 5: Billing Activity */}
        <TabsContent value="activity">
          <ActivityFeed />
        </TabsContent>
      </Tabs>
    </motion.div>

    {/* ── Create Subscription Dialog ──────────────────────────────────────── */}
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base font-bold">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <Plus className="h-4 w-4" />
            </div>
            Assign Subscription Plan
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Upgrade an existing registered organization to a paid enterprise plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubscription} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="org-id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Organization ID <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="org-id"
              placeholder="e.g. 550e8400-e29b-41d4..."
              value={newOrgId}
              onChange={(e) => setNewOrgId(e.target.value)}
              disabled={isCreating}
              required
              autoFocus
              className="rounded-xl border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500/50"
            />
            <p className="text-xs text-slate-400">Find UUIDs in the Organizations tab above.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Plan
            </Label>
            <select
              id="plan-select"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              disabled={isCreating}
              className="w-full h-10 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-card px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional (Dedicated Rental)</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom Global License</option>
            </select>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !newOrgId.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20">
              {isCreating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assigning...</> : <><Check className="h-4 w-4 mr-2" />Assign Plan</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
