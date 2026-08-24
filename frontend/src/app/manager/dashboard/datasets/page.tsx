"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { Database, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { DatasetExecutiveKPIs } from "@/components/organisms/DatasetExecutiveKPIs"
import { DatasetEnterpriseSearch } from "@/components/organisms/DatasetEnterpriseSearch"
import { DatasetExplorerTable } from "@/components/organisms/DatasetExplorerTable"
import { DatasetAuditTimeline } from "@/components/organisms/DatasetAuditTimeline"
import { DatasetAnalyticsDrawer } from "@/components/organisms/DatasetAnalyticsDrawer"
import { DeleteConfirmModal } from "@/components/organisms/DeleteConfirmModal"

export default function ManagerDatasetCenterPage() {
  const router = useRouter()
  const { data: user } = useAuth()

  const [stats, setStats] = useState<any>(null)
  const [datasets, setDatasets] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [selectedDatasetName, setSelectedDatasetName] = useState("")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingDatasets, setLoadingDatasets] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingStats(true)
      // Use tenant-datasets/stats — same endpoint as org-admin/analyst
      // Returns exact field names DatasetExecutiveKPIs expects
      const res = await api.get("/tenant-datasets/stats")
      setStats(res.data?.data || res.data || null)
    } catch (e) {
      console.error("Failed to fetch manager dataset stats", e)
    } finally {
      if (!silent) setLoadingStats(false)
    }
  }, [])

  const fetchDatasets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingDatasets(true)
      const query = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
      const res = await api.get(`/tenant-datasets?skip=0&limit=50${query}`)
      const raw = res.data?.data || res.data || {}
      const list = raw.datasets || raw || []
      
      setDatasets(list)
    } catch (e) {
      console.error("Failed to fetch manager datasets", e)
    } finally {
      if (!silent) setLoadingDatasets(false)
    }
  }, [searchQuery])

  const fetchActivities = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoadingActivities(true)
      const res = await api.get("/tenant-datasets/activities")
      const combined = [
        ...(res.data?.data?.audit_logs || []),
        ...(res.data?.data?.ai_activities || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setActivities(combined.slice(0, 15))
    } catch (e) {
      console.error("Failed to fetch activities", e)
      setActivities([])
    } finally {
      if (!silent) setLoadingActivities(false)
    }
  }, [])

  const refreshAll = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    await Promise.all([
      fetchStats(silent),
      fetchDatasets(silent),
    ])
    if (!silent) setIsRefreshing(false)
    // Activities loads independently so it can't block the main data
    fetchActivities(silent).catch(console.error)
  }, [fetchStats, fetchDatasets, fetchActivities])

  useEffect(() => {
    refreshAll()
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatasets()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Auto-poll if any datasets are processing
  useEffect(() => {
    const hasProcessing = datasets.some(
      (d) => d.status === "processing" || d.status === "uploading" || d.status === "profiling"
    )
    if (hasProcessing) {
      const interval = setInterval(() => refreshAll(true), 5000)
      return () => clearInterval(interval)
    }
  }, [datasets])

  const handleRowAction = async (action: string, id: string) => {
    if (action === "delete") {
      const ds = datasets.find((d) => d.id === id)
      setDatasetToDelete(ds)
      setDeleteModalOpen(true)
    } else if (action === "preview" || action === "analyze") {
      const ds = datasets.find((d) => d.id === id)
      setSelectedDatasetId(id)
      setSelectedDatasetName(ds?.name || "")
      setIsAnalyticsOpen(true)
    }
  }

  const confirmDelete = async () => {
    if (!datasetToDelete) return
    try {
      setIsDeleting(true)
      await api.delete(`/tenant-datasets/${datasetToDelete.id}`)
      toast.success("Dataset deleted successfully")
      setDeleteModalOpen(false)
      setDatasetToDelete(null)
      refreshAll(true)
    } catch (e: any) {
      console.error("Failed to delete dataset", e)
      toast.error(e.response?.data?.detail || "Failed to delete dataset")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <title>Dataset Center | Manager</title>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-6 rounded-none shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-none shadow-md">
              <Database className="w-6 h-6" />
            </div>
            Data Catalog &amp; Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inspect, analyze, and manage datasets across your organization workspace.
          </p>
        </div>

        <button
          onClick={() => refreshAll()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-none text-xs font-semibold border border-slate-200/60 dark:border-white/10 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Sync Data"}
        </button>
      </div>

      {/* KPI Cards — same as org-admin/analyst */}
      {!loadingStats && <DatasetExecutiveKPIs stats={stats} />}

      {/* Main 2-col Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Search + Table */}
        <div className="lg:col-span-2 space-y-6">
          <DatasetEnterpriseSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <DatasetExplorerTable
            datasets={datasets}
            loading={loadingDatasets}
            onAction={handleRowAction}
            statusFilter={statusFilter}
            currentUser={user}
          />
        </div>

        {/* Right: Activity Timeline */}
        <div className="lg:col-span-1">
          <DatasetAuditTimeline
            activities={activities}
            loading={loadingActivities}
          />
        </div>
      </div>

      {/* Analytics Drawer */}
      <DatasetAnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        datasetId={selectedDatasetId}
        datasetName={selectedDatasetName}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDatasetToDelete(null)
        }}
        onConfirm={confirmDelete}
        datasetName={datasetToDelete?.name}
        loading={isDeleting}
      />
    </div>
  )
}
