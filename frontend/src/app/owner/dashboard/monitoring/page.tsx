"use client"

import { Activity, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemMonitoring } from "@/components/organisms/SystemMonitoring"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useState } from "react"

export default function MonitoringPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    toast.info("Syncing telemetry data...")
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Telemetry up to date.")
    }, 1200)
  }

  const handleExport = () => {
    toast.success("Diagnostics report generated.")
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
          <Button onClick={handleRefresh} variant="outline" className="h-9 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Button onClick={handleExport} className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all">
            <Download className="h-4 w-4 mr-2" />
            Export Diagnostics
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
