"use client"

import { Users, Plus, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsersDataGrid } from "@/components/organisms/UsersDataGrid"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function UsersPage() {
  const handleExport = () => {
    toast.success("Users CSV export started...")
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            Platform Users
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Manage all registered individuals across all organizations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" className="h-9 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UsersDataGrid />
      </motion.div>

    </div>
  )
}
