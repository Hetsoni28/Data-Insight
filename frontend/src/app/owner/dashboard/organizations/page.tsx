"use client"
import dynamic from "next/dynamic"
import { Building2, Plus, Download, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toast } from "sonner"
import api from "@/lib/api"
import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"



const OrganizationDataGrid = dynamic(() => import('@/components/organisms/OrganizationDataGrid').then(m => m.OrganizationDataGrid), { ssr: false })
const LiveKpiDashboard = dynamic(() => import('@/components/organisms/LiveKpiDashboard').then(m => m.LiveKpiDashboard), { ssr: false })
const OrganizationAnalytics = dynamic(() => import('@/components/organisms/OrganizationAnalytics').then(m => m.OrganizationAnalytics), { ssr: false })
const CreateOrganizationModal = dynamic(() => import('@/components/organisms/CreateOrganizationModal').then(m => m.CreateOrganizationModal), { ssr: false })

export default function OrganizationsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsCreateModalOpen(true)
      // Clean up the URL so it doesn't reopen on refresh
      router.replace('/owner/dashboard/organizations', { scroll: false })
    }
  }, [searchParams, router])
  
  const handleExportCSV = async () => {
    toast.info("Generating CSV...")
    try {
      const res = await api.get("/admin/tenants")
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.items || [])
      if (!list || list.length === 0) {
        toast.error("No data to export.")
        return
      }
      const headers = ["ID", "Name", "Plan", "Status", "Created At", "MRR", "Health Score", "Security Score"]
      const csvRows = [headers.join(",")]
      
      list.forEach((t: any) => {
        csvRows.push([
          t.id, 
          `"${t.name}"`, 
          t.plan, 
          t.is_active ? "Active" : "Suspended", 
          t.created_at,
          t.mrr,
          t.health_score,
          t.security_score
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
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-[#0A3A2A]" />
            Organizations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-2 max-w-2xl">
            Manage every company using the Data Insight platform. Monitor health scores, usage limits, and enterprise subscriptions.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="h-10 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="h-10 px-5 rounded-md bg-[#0A3A2A] hover:bg-[#06261c] text-white shadow-sm transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Live KPI Dashboard */}
      <LiveKpiDashboard />

      {/* Analytics Charts */}
      <OrganizationAnalytics chartData={[]} />

      {/* Main Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Directory</h2>
          <p className="text-sm text-slate-500">Detailed list of all customers, active trials, and suspended accounts.</p>
        </div>
        <OrganizationDataGrid />
      </motion.div>

      <CreateOrganizationModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-global-kpis'] })
          queryClient.invalidateQueries({ queryKey: ['admin-tenant-analytics'] })
          queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
          queryClient.invalidateQueries({ queryKey: ['owner-revenue-kpis'] })
        }}
      />
    </div>
  )
}
