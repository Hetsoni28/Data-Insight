"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Calendar as CalendarIcon, FileText, ChevronDown } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { RevenueKpiGrid } from "@/components/organisms/RevenueKpiGrid"
import { ExecutiveSummaryCard } from "@/components/organisms/ExecutiveSummaryCard"
import { RevenueAnalyticsCharts } from "@/components/organisms/RevenueAnalyticsCharts"
import { TopOrganizationsTable } from "@/components/organisms/TopOrganizationsTable"
import { FinancialActivityTimeline } from "@/components/organisms/FinancialActivityTimeline"

const DATE_RANGES = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 90 Days", value: 90 },
  { label: "Last 12 Months", value: 365 },
] as const

type DateRange = typeof DATE_RANGES[number]

export default function OwnerRevenueDashboardPage() {
  const queryClient = useQueryClient()
  const [selectedRange, setSelectedRange] = useState<DateRange>(DATE_RANGES[1])
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["owner-revenue-kpis"] })
    queryClient.invalidateQueries({ queryKey: ["owner-revenue-trends"] })
    queryClient.invalidateQueries({ queryKey: ["owner-revenue-forecast"] })
    queryClient.invalidateQueries({ queryKey: ["owner-ai-costs"] })
    queryClient.invalidateQueries({ queryKey: ["owner-revenue-health"] })
    queryClient.invalidateQueries({ queryKey: ["owner-billing-activity"] })
    queryClient.invalidateQueries({ queryKey: ["owner-organizations-top"] })
    toast.success("Financial data refreshed")
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    toast.info("Generating Financial CSV...")
    try {
      const { data } = await api.get(`/owner/subscriptions/organizations?skip=0&limit=100`)
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
          t.created_at,
        ].join(","))
      })
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `global_financial_export_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Financial export complete.")
    } catch {
      toast.error("Failed to export financial data.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    toast.info("Compiling AI Financial Report...")
    try {
      const [kpisRes, trendsRes, forecastRes] = await Promise.all([
        api.get("/owner/subscriptions/kpis").catch(() => ({ data: {} })),
        api.get("/owner/subscriptions/revenue-trends").catch(() => ({ data: {} })),
        api.get("/owner/subscriptions/analytics/forecast").catch(() => ({ data: [] })),
      ])
      const report = {
        report_title: "Data Insight — Financial Intelligence Report",
        generated_at: new Date().toISOString(),
        period: selectedRange.label,
        kpis: kpisRes.data,
        revenue_trends: trendsRes.data,
        forecast: forecastRes.data,
      }
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `financial_report_${new Date().toISOString().split("T")[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Financial report exported successfully.")
    } catch {
      toast.error("Failed to generate report. Check API connection.")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto w-full pb-20">
      
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Revenue Intelligence</h1>
          <p className="text-slate-500 mt-1">
            Monitor every financial metric of your Data Insight platform.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Date Range Dropdown — now functional */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedRange.label}
                <ChevronDown className="h-4 w-4 ml-2 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {DATE_RANGES.map((range) => (
                <DropdownMenuItem
                  key={range.value}
                  onClick={() => {
                    setSelectedRange(range)
                    handleRefresh()
                  }}
                  className={selectedRange.value === range.value ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : ""}
                >
                  {range.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            className="h-10 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>

          <Button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="h-10 px-4 rounded-md bg-[#0A3A2A] hover:bg-[#0A3A2A]/90 text-white shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGeneratingReport ? "Generating..." : "Generate AI Report"}
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
