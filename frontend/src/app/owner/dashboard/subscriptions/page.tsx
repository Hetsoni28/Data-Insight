"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { 
  Plus, Download, RefreshCw, Loader2, 
  DollarSign, BarChart3, Users, Sparkles,
  TrendingUp, CreditCard, ShieldCheck, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { SubscriptionRevenueKpi } from "@/components/organisms/SubscriptionRevenueKpi"
import { SubscriptionAnalyticsCharts } from "@/components/organisms/SubscriptionAnalyticsCharts"
import { SubscriptionDataGrid } from "@/components/organisms/SubscriptionDataGrid"

export default function SubscriptionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgId, setNewOrgId] = useState("")
  const [newPlan, setNewPlan] = useState("starter")

  // Fetch KPIs
  const { 
    data: kpis, 
    isLoading: isKpisLoading, 
    refetch: refetchKpis 
  } = useQuery({
    queryKey: ['owner-subscriptions-kpis'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/kpis')
      return res.data
    }
  })

  // Fetch Trends
  const { 
    data: trends, 
    isLoading: isTrendsLoading, 
    refetch: refetchTrends 
  } = useQuery({
    queryKey: ['owner-subscriptions-trends'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/revenue-trends')
      return res.data
    }
  })

  // Fetch Subscriptions Data Grid
  const { 
    data: subscriptionsData, 
    isLoading: isSubscriptionsLoading, 
    refetch: refetchSubscriptions 
  } = useQuery({
    queryKey: ['owner-subscriptions-list'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/organizations?skip=0&limit=50')
      return res.data.data
    }
  })

  const handleRefresh = () => {
    refetchKpis()
    refetchTrends()
    refetchSubscriptions()
    toast.success("Dashboard refreshed.")
  }

  const handleExportCSV = async () => {
    toast.info("Generating Revenue CSV...")
    try {
      const { data } = await api.get("/owner/subscriptions/organizations?skip=0&limit=100")
      if (!data || !data.data || data.data.length === 0) {
        toast.error("No data to export.")
        return
      }
      const headers = ["ID", "Name", "Plan", "Status", "MRR", "Billing Cycle", "Created At"]
      const csvRows = [headers.join(",")]
      
      data.data.forEach((t: any) => {
        csvRows.push([
          t.id, 
          `"${t.name}"`, 
          t.plan, 
          t.status, 
          t.mrr,
          t.billing_cycle,
          t.created_at
        ].join(","))
      })
      
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `revenue_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success("Revenue export complete.")
    } catch (e) {
      toast.error("Failed to export revenue data.")
    }
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgId.trim()) {
      toast.error("Please enter an Organization ID.")
      return
    }
    setIsCreating(true)
    try {
      await api.post(`/owner/subscriptions/${newOrgId.trim()}/upgrade`, { plan: newPlan })
      toast.success(`Subscription created — org upgraded to ${newPlan} plan.`)
      setIsCreateOpen(false)
      setNewOrgId("")
      setNewPlan("starter")
      refetchKpis()
      refetchTrends()
      refetchSubscriptions()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to create subscription."
      toast.error(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const mrr = kpis?.mrr || 0
  const activeCount = kpis?.active_subscriptions || 0
  const arr = kpis?.arr || mrr * 12

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 space-y-8 max-w-[1800px] mx-auto min-h-screen text-slate-900 dark:text-slate-100"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-md">
              <CreditCard className="h-6 w-6" />
            </div>
            Subscription Command Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Manage organization subscriptions, billing, AI usage quotas, and platform revenue.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl border-slate-200/80 dark:border-white/10 text-xs font-bold shadow-sm hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-200/80 dark:border-white/10 text-xs font-bold shadow-sm gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Dark Gradient Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c291e] via-[#133e2e] to-[#091e16] dark:from-slate-900 dark:via-emerald-950/60 dark:to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20"
      >
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 pointer-events-none">
          <div className="h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-1/4 translate-y-12 pointer-events-none">
          <div className="h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 p-7 md:p-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left — Identity */}
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white shrink-0">
                  <DollarSign className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Platform Revenue Overview
                  </h2>
                  <p className="text-emerald-200/90 text-xs md:text-sm mt-0.5 font-medium flex items-center gap-2">
                    <span>SaaS Subscription Billing Engine</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Live Metrics
                    </span>
                  </p>
                </div>
              </div>

              {/* Key Metrics Strip */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-emerald-200/70 font-medium uppercase tracking-wider">MRR</div>
                    <div className="text-lg font-black text-white">
                      {isKpisLoading ? "—" : `$${mrr.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <Activity className="h-4 w-4 text-teal-400" />
                  <div>
                    <div className="text-[10px] text-emerald-200/70 font-medium uppercase tracking-wider">ARR</div>
                    <div className="text-lg font-black text-white">
                      {isKpisLoading ? "—" : `$${arr.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <Users className="h-4 w-4 text-sky-400" />
                  <div>
                    <div className="text-[10px] text-emerald-200/70 font-medium uppercase tracking-wider">Active Orgs</div>
                    <div className="text-lg font-black text-white">
                      {isKpisLoading ? "—" : activeCount}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  <div>
                    <div className="text-[10px] text-emerald-200/70 font-medium uppercase tracking-wider">Failed Pmts</div>
                    <div className="text-lg font-black text-white">
                      {isKpisLoading ? "—" : kpis?.failed_payments || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 text-sm px-6 py-3 h-auto"
              >
                <Plus className="h-4 w-4" />
                New Subscription
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold rounded-2xl text-sm px-6 py-3 h-auto"
              >
                <Download className="h-4 w-4" />
                Export Revenue
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl text-xs md:text-sm font-extrabold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all px-4 py-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Revenue KPIs
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-xl text-xs md:text-sm font-extrabold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all px-4 py-2"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends & Analytics
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="rounded-xl text-xs md:text-sm font-extrabold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all px-4 py-2"
          >
            <Users className="h-4 w-4 mr-2" />
            All Subscriptions
            {activeCount > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500 text-white text-[10px] px-2 py-0.5 font-black">
                {activeCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Revenue KPIs */}
        <TabsContent value="overview" className="space-y-6">
          <SubscriptionRevenueKpi data={kpis} isLoading={isKpisLoading} />
        </TabsContent>

        {/* Tab 2: Trends & Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <SubscriptionAnalyticsCharts data={trends} isLoading={isTrendsLoading} />
        </TabsContent>

        {/* Tab 3: Subscriptions Grid */}
        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionDataGrid data={subscriptionsData} isLoading={isSubscriptionsLoading} />
        </TabsContent>
      </Tabs>
    </motion.div>

    {/* Create Subscription Modal */}
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            Create Subscription
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Upgrade an existing organization to a paid plan. The organization must already be registered.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubscription} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="org-id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Organization ID</Label>
            <Input
              id="org-id"
              placeholder="e.g. org_01j9abc..."
              value={newOrgId}
              onChange={(e) => setNewOrgId(e.target.value)}
              disabled={isCreating}
              required
              autoFocus
              className="rounded-xl border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500/50"
            />
            <p className="text-xs text-slate-500">Find IDs in the Organizations tab.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subscription Plan</Label>
            <select
              id="plan-select"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              disabled={isCreating}
              className="w-full h-10 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-card px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !newOrgId.trim()} className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20">
              {isCreating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Create Subscription</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
