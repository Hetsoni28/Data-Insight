"use client"
import { Building2, Plus, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrganizationDataGrid } from "@/components/organisms/OrganizationDataGrid"
import { motion } from "framer-motion"
import { toast } from "sonner"
import api from "@/lib/api"

export default function OrganizationsPage() {
  
  const handleExportCSV = async () => {
    toast.info("Generating CSV...")
    try {
      const { data } = await api.get("/admin/tenants")
      if (!data || data.length === 0) {
        toast.error("No data to export.")
        return
      }
      const headers = ["ID", "Name", "Plan", "Status", "Created At"]
      const csvRows = [headers.join(",")]
      
      data.forEach((t: any) => {
        csvRows.push([
          t.id, 
          `"${t.name}"`, 
          t.plan, 
          t.is_active ? "Active" : "Suspended", 
          t.created_at
        ].join(","))
      })
      
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `organizations_export_${new Date().toISOString().split('T')[0]}.csv`
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-600" />
            Organizations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage all platform tenants, view usage limits, and handle subscriptions.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="h-9 px-4 rounded-md bg-white border-slate-200 text-slate-600 shadow-sm hover:text-slate-900 hover:bg-slate-50">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => toast.info("New Organization modal coming soon!")} className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all">
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <OrganizationDataGrid />
      </motion.div>
    </div>
  )
}
