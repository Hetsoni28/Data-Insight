"use client"

import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Calendar as CalendarIcon, FileText } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"

import { RevenueKpiGrid } from "@/components/organisms/RevenueKpiGrid"
import { ExecutiveSummaryCard } from "@/components/organisms/ExecutiveSummaryCard"
import { RevenueAnalyticsCharts } from "@/components/organisms/RevenueAnalyticsCharts"
import { TopOrganizationsTable } from "@/components/organisms/TopOrganizationsTable"
import { FinancialActivityTimeline } from "@/components/organisms/FinancialActivityTimeline"

export default function OwnerRevenueDashboardPage() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-revenue-kpis'] })
    queryClient.invalidateQueries({ queryKey: ['owner-revenue-trends'] })
    queryClient.invalidateQueries({ queryKey: ['owner-revenue-forecast'] })
    queryClient.invalidateQueries({ queryKey: ['owner-ai-costs'] })
    queryClient.invalidateQueries({ queryKey: ['owner-revenue-health'] })
    queryClient.invalidateQueries({ queryKey: ['owner-billing-activity'] })
    queryClient.invalidateQueries({ queryKey: ['owner-organizations-top'] })
    toast.success("Financial data refreshed")
  }

  const handleExportCSV = async () => {
    toast.info("Generating Global Financial CSV...")
    try {
      const { data } = await api.get("/owner/subscriptions/organizations?skip=0&limit=100")
      if (!data || !data.data || data.data.length === 0) {
        toast.error("No data to export.")
        return
      }
      const headers = ["Organization ID", "Name", "Plan", "Status", "MRR", "Billing Cycle", "Created At"]
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
      a.download = `global_financial_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success("Financial export complete.")
    } catch (e) {
      toast.error("Failed to export financial data.")
    }
  }

  const handleGenerateReport = () => {
    toast.success("Compiling AI Financial Report PDF... (Check downloads soon)")
    setTimeout(() => {
      window.print() // Native print dialog as requested by user
    }, 1500)
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-20 print:p-0 print:bg-white print:text-black">
      
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Revenue Intelligence</h1>
          <p className="text-slate-500 mt-1">
            Monitor every financial metric of your Data Insight platform.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleRefresh} variant="outline" size="icon" className="h-10 w-10 shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-10 px-4 rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Last 30 Days
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="h-10 px-4 rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleGenerateReport} className="h-10 px-4 rounded-md bg-[#0A3A2A] hover:bg-[#0A3A2A]/90 text-white shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate AI Report
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Executive Summary & KPIs */}
        <section className="space-y-6">
          <ExecutiveSummaryCard />
          <RevenueKpiGrid />
        </section>

        {/* Analytics Charts */}
        <section>
          <RevenueAnalyticsCharts />
        </section>

        {/* Bottom Grids */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TopOrganizationsTable />
          </div>
          <div className="lg:col-span-1">
            <FinancialActivityTimeline />
          </div>
        </section>
      </div>
      
    </div>
  )
}
