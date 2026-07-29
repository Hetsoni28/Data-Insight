"use client"

import { DollarSign, Download, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevenueAnalytics } from "@/components/organisms/RevenueAnalytics"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function RevenuePage() {
  const handleExport = () => {
    toast.info("Generating Revenue CSV...")
    try {
      const headers = ["Month", "MRR", "ARR", "Active Subscriptions", "Churn Rate (%)"]
      const mockData = [
        ["January 2026", "$32,000", "$384,000", "280", "2.1"],
        ["February 2026", "$34,500", "$414,000", "295", "1.8"],
        ["March 2026", "$36,000", "$432,000", "310", "2.0"],
        ["April 2026", "$38,500", "$462,000", "325", "2.3"],
        ["May 2026", "$40,200", "$482,400", "330", "1.9"],
        ["June 2026", "$42,500", "$510,000", "342", "2.4"],
      ]
      
      const csvRows = [headers.join(","), ...mockData.map(row => row.join(","))]
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success("Revenue report exported successfully.")
    } catch (e) {
      toast.error("Failed to export data.")
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            Revenue & Subscriptions
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Track MRR growth, plan distribution, and financial health.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => toast.info("Date range picker")} variant="outline" className="h-9 px-4 rounded-md bg-white border-slate-200 text-slate-600 shadow-sm hover:text-slate-900 hover:bg-slate-50">
            <Calendar className="h-4 w-4 mr-2" />
            Last 6 Months
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
        <RevenueAnalytics />
      </motion.div>

    </div>
  )
}
