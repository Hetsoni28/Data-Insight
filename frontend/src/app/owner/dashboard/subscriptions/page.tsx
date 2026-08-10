"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Download, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  return (
    <>
    <div className="p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full pb-20">
      
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Subscriptions</h1>
          <p className="text-slate-500 mt-1">
            Manage organization subscriptions, billing, AI usage, and revenue.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="h-10 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10">
            <Download className="h-4 w-4 mr-2" />
            Export Revenue
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="h-10 px-4 rounded-md bg-[#0A3A2A] hover:bg-[#06261c] text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Subscription
          </Button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <SubscriptionRevenueKpi data={kpis} isLoading={isKpisLoading} />

      {/* Analytics Charts */}
      <SubscriptionAnalyticsCharts data={trends} isLoading={isTrendsLoading} />

      {/* Subscription Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Subscriptions</h2>
        </div>
        <SubscriptionDataGrid data={subscriptionsData} isLoading={isSubscriptionsLoading} />
      </div>

    </div>

    {/* Create Subscription Modal */}
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            Create Subscription
          </DialogTitle>
          <DialogDescription>
            Upgrade an existing organization to a paid plan. The organization must already be registered.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubscription} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="org-id">Organization ID</Label>
            <Input
              id="org-id"
              placeholder="e.g. org_01j9abc..."
              value={newOrgId}
              onChange={(e) => setNewOrgId(e.target.value)}
              disabled={isCreating}
              required
              autoFocus
            />
            <p className="text-xs text-slate-500">Find IDs in the Organizations tab.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-select">Subscription Plan</Label>
            <select
              id="plan-select"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              disabled={isCreating}
              className="w-full h-10 rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-card px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !newOrgId.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
