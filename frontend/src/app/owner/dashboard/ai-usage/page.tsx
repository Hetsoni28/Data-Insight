"use client"

import { Zap, Download, RefreshCw, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { AiAnalyticsCharts } from "@/components/organisms/AiAnalyticsCharts"
import { useState } from "react"

export default function AiUsagePage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    toast.info("Refreshing AI analytics...")
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("AI Analytics are up to date.")
    }, 800)
  }

  const handleExport = () => {
    toast.info("Generating AI Usage CSV...")
    try {
      // Generate a mock CSV for the AI Usage data
      const headers = ["Date", "GPT-4 Tokens", "Claude Tokens", "Llama Tokens", "Total Tokens"]
      const mockData = [
        ["2026-07-23", "12000", "8000", "2000", "22000"],
        ["2026-07-24", "15000", "9500", "2500", "27000"],
        ["2026-07-25", "18000", "11000", "3000", "32000"],
        ["2026-07-26", "14000", "9000", "2100", "25100"],
        ["2026-07-27", "21000", "13000", "4000", "38000"],
        ["2026-07-28", "25000", "16000", "5500", "46500"],
        ["2026-07-29", "32000", "21000", "8000", "61000"],
      ]
      
      const csvRows = [headers.join(","), ...mockData.map(row => row.join(","))]
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ai_usage_report_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success("Export complete.")
    } catch (e) {
      toast.error("Failed to export data.")
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            AI Usage Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Monitor API token consumption, model distributions, and latency across the platform.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => toast.info("Date picker opening...")} variant="outline" className="h-9 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5">
            <Calendar className="h-4 w-4 mr-2" />
            Last 7 Days
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="h-9 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleExport} className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AiAnalyticsCharts />
      </motion.div>

    </div>
  )
}
