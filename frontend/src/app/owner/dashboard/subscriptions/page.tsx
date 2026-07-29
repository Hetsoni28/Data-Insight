"use client"

import { CreditCard, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SubscriptionsDataGrid } from "@/components/organisms/SubscriptionsDataGrid"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function SubscriptionsPage() {
  const handleExport = () => {
    toast.success("Subscriptions report CSV export started...")
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            Subscriptions
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Manage all active tenant SaaS plans, billing cycles, and payment statuses.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" className="h-9 px-4 rounded-md bg-white border-slate-200 text-slate-600 shadow-sm hover:text-slate-900 hover:bg-slate-50">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => toast.info("Stripe portal linking...")} className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all">
            Open Stripe Portal
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SubscriptionsDataGrid />
      </motion.div>

    </div>
  )
}
