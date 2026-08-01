"use client"

import { Activity, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemMonitoring } from "@/components/organisms/SystemMonitoring"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"

export default function MonitoringPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ["admin-monitoring"] })
      await queryClient.invalidateQueries({ queryKey: ["monitoring"] })
      toast.success("Telemetry synced successfully.")
    } catch {
      toast.error("Failed to sync telemetry data.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    toast.info("Compiling diagnostics report...")
    try {
      const { data } = await api.get("/admin/monitoring")
      const report = {
        exported_at: new Date().toISOString(),
        platform: "Data Insight",
        diagnostics: data,
      }
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `diagnostics_report_${new Date().toISOString().split("T")[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Diagnostics report exported.")
    } catch {
      toast.error("Failed to export diagnostics. Check API connection.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            System Monitoring
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Real-time platform telemetry, database health, and API performance.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="h-9 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync Data"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
          >
            <Download className={`h-4 w-4 mr-2 ${isExporting ? "animate-bounce" : ""}`} />
            {isExporting ? "Exporting..." : "Export Diagnostics"}
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SystemMonitoring />
      </motion.div>

    </div>
  )
}
