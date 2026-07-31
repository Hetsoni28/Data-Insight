"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"
import { SubscriptionRevenueKpi } from "@/components/organisms/SubscriptionRevenueKpi"
import { SubscriptionAnalyticsCharts } from "@/components/organisms/SubscriptionAnalyticsCharts"
import { SubscriptionDataGrid } from "@/components/organisms/SubscriptionDataGrid"

export default function SubscriptionsPage() {
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

  const handleCreateSubscription = () => {
    toast.success("Opening checkout flow (Coming Soon)")
  }

  return (
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
          <Button onClick={handleRefresh} variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="h-10 px-4 rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export Revenue
          </Button>
          <Button onClick={handleCreateSubscription} className="h-10 px-4 rounded-md bg-[#0A3A2A] hover:bg-[#06261c] text-white shadow-sm">
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
  )
}
