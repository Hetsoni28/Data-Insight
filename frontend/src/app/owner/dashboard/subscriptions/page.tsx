"use client"
import dynamic from "next/dynamic"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Plus, Download, RefreshCw, Loader2,
  DollarSign, Users, TrendingUp, CreditCard,
  Activity, ShieldCheck, BarChart3, FileText,
  History, Zap, Server, Building2, Check, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"

// ── Organisms ─────────────────────────────────────────────────────────────────
import {


  SubscriptionPlanCard,
  DEDICATED_RENTAL_FEATURES,
  CUSTOM_LICENSE_FEATURES
} from "@/components/organisms/SubscriptionPlanCard"

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

// ── Main Page ─────────────────────────────────────────────────────────────────
const SubscriptionAnalyticsCharts = dynamic(() => import('@/components/organisms/SubscriptionAnalyticsCharts').then(m => m.SubscriptionAnalyticsCharts), { ssr: false })
const SubscriptionDataGrid = dynamic(() => import('@/components/organisms/SubscriptionDataGrid').then(m => m.SubscriptionDataGrid), { ssr: false })
const OwnerInvoicesTable = dynamic(() => import('@/components/organisms/OwnerInvoicesTable').then(m => m.OwnerInvoicesTable), { ssr: false })
const BillingActivityFeed = dynamic(() => import('@/components/organisms/BillingActivityFeed').then(m => m.BillingActivityFeed), { ssr: false })
const SubscriptionRevenueKpi = dynamic(() => import('@/components/organisms/SubscriptionRevenueKpi').then(m => m.SubscriptionRevenueKpi), { ssr: false })

export default function SubscriptionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgId, setNewOrgId] = useState("")
  const [newPlan, setNewPlan] = useState("professional")
  const queryClient = useQueryClient()

  const { data: kpis, isLoading: isKpisLoading, refetch: refetchKpis } = useQuery({
    queryKey: ['owner-subscriptions-kpis'],
    queryFn: async () => (await api.get('/owner/billing/kpis')).data
  })

  const { data: trends, isLoading: isTrendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['owner-subscriptions-trends'],
    queryFn: async () => (await api.get('/owner/billing/revenue-trends')).data
  })

  const { data: subscriptionsData, isLoading: isSubscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['owner-subscriptions-list'],
    queryFn: async () => {
      const res = await api.get('/owner/billing/organizations?skip=0&limit=50')
      return Array.isArray(res.data?.data) ? res.data.data : []
    }
  })

  const { data: health } = useQuery({
    queryKey: ['owner-subscriptions-health'],
    queryFn: async () => (await api.get('/owner/billing/analytics/health')).data
  })

  const handleRefresh = () => {
    refetchKpis(); refetchTrends(); refetchSubscriptions()
    queryClient.invalidateQueries({ queryKey: ['owner-invoices'] })
    queryClient.invalidateQueries({ queryKey: ['owner-billing-activity'] })
    toast.success("Dashboard refreshed.")
  }

  const handleExportCSV = async () => {
    toast.info("Generating CSV...")
    try {
      const { data } = await api.get("/owner/billing/organizations?skip=0&limit=100")
      const rows: any[] = Array.isArray(data?.data) ? data.data : []
      if (!rows.length) { toast.error("No data to export."); return }
      const headers = ["ID", "Name", "Plan", "Status", "MRR", "Billing Cycle", "Users", "Storage (GB)", "Created At"]
      const csv = [headers, ...rows.map((t: any) =>
        [t.id, `"${t.name}"`, t.plan, t.status, t.mrr, t.billing_cycle, t.users, t.storage_used, t.created_at]
      )].map(r => r.join(",")).join("\n")
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
        download: `subscriptions_${new Date().toISOString().split('T')[0]}.csv`
      })
      a.click(); toast.success("Export complete.")
    } catch { toast.error("Failed to export.") }
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgId.trim()) { toast.error("Please enter an Organization ID."); return }
    setIsCreating(true)
    try {
      await api.post(`/owner/billing/${newOrgId.trim()}/upgrade`, { plan: newPlan })
      toast.success(`Organization upgraded to ${newPlan} plan.`)
      setIsCreateOpen(false); setNewOrgId(""); setNewPlan("professional")
      refetchKpis(); refetchTrends(); refetchSubscriptions()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to assign plan.")
    } finally { setIsCreating(false) }
  }

  const mrr = kpis?.mrr ?? 0
  const arr = kpis?.arr ?? 0
  const totalRevenue = kpis?.total_revenue ?? 0
  const activeCount = kpis?.active_subscriptions ?? 0
  const arpu = kpis?.arpu ?? 0
  const churnRate = kpis?.churn_rate ?? 0
  const netProfit = kpis?.net_profit ?? 0
  const failedPayments = kpis?.failed_payments ?? 0

  const heroMetrics = [
    { label: "MRR", value: isKpisLoading ? "—" : fmtUsd(mrr), icon: TrendingUp, color: "text-emerald-400" },
    { label: "ARR", value: isKpisLoading ? "—" : fmtUsd(arr), icon: Activity, color: "text-teal-400" },
    { label: "Total Collected", value: isKpisLoading ? "—" : fmtUsd(totalRevenue), icon: CreditCard, color: "text-sky-400" },
    { label: "Net Profit", value: isKpisLoading ? "—" : fmtUsd(netProfit), icon: Zap, color: "text-violet-400" },
  ]

  const secondaryMetrics = [
    { label: "Active Orgs", value: isKpisLoading ? "—" : String(activeCount), icon: Users },
    { label: "ARPU", value: isKpisLoading ? "—" : fmtUsd(arpu), icon: BarChart3 },
    { label: "Churn Rate", value: isKpisLoading ? "—" : `${churnRate}%`, icon: AlertTriangle },
    { label: "Failed Pmts", value: isKpisLoading ? "—" : fmtUsd(failedPayments), icon: ShieldCheck },
  ]

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 space-y-8 max-w-[1800px] mx-auto pb-20">

      {/* Header */}
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
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
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

      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c291e] via-[#133e2e] to-[#091e16] border border-emerald-500/30 shadow-2xl shadow-emerald-950/20">
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
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg text-white shrink-0">
                  <DollarSign className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Platform Revenue Overview</h2>
                  <p className="text-emerald-200/80 text-xs md:text-sm mt-0.5 font-medium flex items-center gap-2">
                    <span>Enterprise System Rental Billing Engine</span>
                    <span>•</span>
                    <span className={`font-bold flex items-center gap-1 ${(health?.score ?? 100) >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block ${(health?.score ?? 100) >= 80 ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {health?.status ?? "Live"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {heroMetrics.map(({ label, value, icon: Icon, color }) => (
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

            <div className="grid grid-cols-2 gap-3 shrink-0 w-full lg:w-auto">
              {secondaryMetrics.map(({ label, value, icon: Icon }) => (
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

      {/* Tabs */}
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
              <Icon className="h-4 w-4 mr-2" />{label}
              {count !== undefined && count > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500 text-white text-[10px] px-2 py-0.5 font-black">{count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enterprise System Rental &{" "}
              <span className="text-emerald-600 dark:text-emerald-400">Dedicated Platform Licensing</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rent Data Insight as a turn-key private AI Business Intelligence infrastructure, or white-label it for enterprise clients.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <SubscriptionPlanCard
              title="Dedicated System Rental"
              description="Complete turn-key AI Business Intelligence system rental hosted in a dedicated, isolated single-tenant VPC."
              icon={Server}
              price="$15,000"
              priceSub="/ month (or $12,500/mo annual)"
              isFeatured
              badgeLabel="Most Popular"
              features={DEDICATED_RENTAL_FEATURES}
              actionLabel="Create Subscription"
              onAction={() => { setNewPlan("professional"); setIsCreateOpen(true) }}
            />
            <SubscriptionPlanCard
              title="Custom Global License"
              description="For conglomerates, holding groups, and software providers wanting full platform whitelabel & resale rights."
              icon={Building2}
              price="Custom"
              priceSub="/ annual contract"
              features={CUSTOM_LICENSE_FEATURES}
              actionLabel="Contact Sales"
              onAction={() => { window.location.href = "mailto:licensing@datainsight.com" }}
            />
          </div>

          <div className="max-w-5xl mx-auto">
            <SubscriptionRevenueKpi data={kpis} isLoading={isKpisLoading} />
          </div>
        </TabsContent>

        <TabsContent value="organizations">
          <SubscriptionDataGrid data={subscriptionsData} isLoading={isSubscriptionsLoading} />
        </TabsContent>

        <TabsContent value="analytics">
          <SubscriptionAnalyticsCharts data={trends} isLoading={isTrendsLoading} />
        </TabsContent>

        <TabsContent value="invoices">
          <OwnerInvoicesTable />
        </TabsContent>

        <TabsContent value="activity">
          <BillingActivityFeed />
        </TabsContent>
      </Tabs>
    </motion.div>

    {/* Create Subscription Dialog */}
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
            <Input id="org-id" placeholder="e.g. 550e8400-e29b-41d4..."
              value={newOrgId} onChange={(e) => setNewOrgId(e.target.value)}
              disabled={isCreating} required autoFocus
              className="rounded-xl border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500/50" />
            <p className="text-xs text-slate-400">Find UUIDs in the Organizations tab.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan</Label>
            <select id="plan-select" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}
              disabled={isCreating}
              className="w-full h-10 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-card px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">
              <option value="starter">Starter</option>
              <option value="professional">Professional (Dedicated Rental)</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom Global License</option>
            </select>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={isCreating || !newOrgId.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20">
              {isCreating
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Assigning...</>
                : <><Check className="h-4 w-4 mr-2" />Assign Plan</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
