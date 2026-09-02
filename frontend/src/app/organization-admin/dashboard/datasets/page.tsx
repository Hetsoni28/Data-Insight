import dynamic from "next/dynamic"
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { Database, RefreshCw } from "lucide-react"
import { toast } from "sonner"




const DatasetExecutiveKPIs = dynamic(() => import('@/components/organisms/DatasetExecutiveKPIs').then(m => m.DatasetExecutiveKPIs), { ssr: false })
const DatasetQuickActions = dynamic(() => import('@/components/organisms/DatasetQuickActions').then(m => m.DatasetQuickActions), { ssr: false })
const DatasetEnterpriseSearch = dynamic(() => import('@/components/organisms/DatasetEnterpriseSearch').then(m => m.DatasetEnterpriseSearch), { ssr: false })
const DatasetExplorerTable = dynamic(() => import('@/components/organisms/DatasetExplorerTable').then(m => m.DatasetExplorerTable), { ssr: false })
const DatasetAuditTimeline = dynamic(() => import('@/components/organisms/DatasetAuditTimeline').then(m => m.DatasetAuditTimeline), { ssr: false })
const DatasetActionModal = dynamic(() => import('@/components/organisms/DatasetActionModal').then(m => m.DatasetActionModal), { ssr: false })
const DatasetAnalyticsDrawer = dynamic(() => import('@/components/organisms/DatasetAnalyticsDrawer').then(m => m.DatasetAnalyticsDrawer), { ssr: false })
const DeleteConfirmModal = dynamic(() => import('@/components/organisms/DeleteConfirmModal').then(m => m.DeleteConfirmModal), { ssr: false })

export default function DatasetCenterPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  const { activeWs, setIsUploadOpen } = useWorkspaceStore()
  const [stats, setStats] = useState<any>(null)
  const [datasets, setDatasets] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState("")
  
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

  const refreshAll = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    // Load stats & datasets in parallel first — don't block on activities (can be slow)
    await Promise.all([
      fetchStats(silent),
      fetchDatasets(silent),
    ])
    if (!silent) setIsRefreshing(false)
    // Activities loads independently so it can't block the main data
    fetchActivities(silent).catch(console.error)
  }

  useEffect(() => {
    refreshAll()
  }, [activeWs?.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatasets()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const hasProcessing = datasets.some(d => d.status === 'processing' || d.status === 'uploading' || d.status === 'profiling')
    if (hasProcessing) {
      const interval = setInterval(() => {
        refreshAll(true)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [datasets])

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoadingStats(true)
      const res = await api.get("/tenant-datasets/stats")
      setStats(res.data.data)
    } catch (e: any) {
      if (e.name !== "CanceledError") {
        console.warn("Failed to fetch stats:", e.message || e)
      }
    } finally {
      if (!silent) setLoadingStats(false)
    }
  }

  const fetchDatasets = async (silent = false) => {
    try {
      if (!silent) setLoadingDatasets(true)
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""
      const res = await api.get(`/tenant-datasets${query}`)
      setDatasets(res.data.data)
    } catch (e: any) {
      if (e.name !== "CanceledError") {
        console.warn("Failed to fetch datasets:", e.message || e)
      }
    } finally {
      if (!silent) setLoadingDatasets(false)
    }
  }

  const fetchActivities = async (silent = false) => {
    try {
      if (!silent) setLoadingActivities(true)
      const res = await api.get("/tenant-datasets/activities")
      const combined = [
        ...(res.data.data.audit_logs || []),
        ...(res.data.data.ai_activities || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setActivities(combined.slice(0, 15))
    } catch (e: any) {
      if (e.name !== "CanceledError") {
        console.warn("Failed to fetch activities:", e.message || e)
      }
    } finally {
      if (!silent) setLoadingActivities(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    if (action === 'upload') {
      router.push('/organization-admin/dashboard/upload-dataset')
    } else {
      setCurrentAction(action)
      setActionModalOpen(true)
    }
  }

  const executeWorkflow = async (datasetId: string, action: string) => {
    try {
      await api.post(`/tenant-datasets/${datasetId}/${action}`)
      
      if (action === 'ai-excel') {
        toast.info('AI Excel generation started. This may take 15-30 seconds...')
        // Poll for completion
        let attempts = 0
        const maxAttempts = 48 // 120 seconds
        const pollInterval = setInterval(async () => {
          attempts++
          try {
            const statusRes = await api.get(`/tenant-datasets/${datasetId}`)
            const ds = statusRes.data?.data
            if (ds?.status === 'ready' && ds?.excel_url) {
              clearInterval(pollInterval)
              toast.success('AI Excel is ready! Downloading...')
              // trigger download
              const dlRes = await api.get(`/tenant-datasets/${datasetId}/excel-download`, { responseType: 'blob' })
              const url = window.URL.createObjectURL(new Blob([dlRes.data]))
              const link = document.createElement('a')
              link.href = url
              link.setAttribute('download', `AI_Excel_${ds.name}.xlsx`)
              document.body.appendChild(link)
              link.click()
              link.remove()
              window.URL.revokeObjectURL(url)
              refreshAll(true)
            } else if (ds?.status === 'error') {
              clearInterval(pollInterval)
              toast.error(`Excel generation failed: ${ds.error_message || 'Unknown error'}`)
            }
          } catch { /* ignore poll errors */ }
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            toast.error('Excel generation timed out. Please try again.')
          }
        }, 2500)
      } else {
        toast.success(`Successfully started ${action.replace('-', ' ')} processing!`)
        refreshAll(true)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || `Failed to start ${action}.`)
    }
  }

  const handleRowAction = async (action: string, id: string) => {
    if (action === 'delete') {
      const ds = datasets.find(d => d.id === id)
      setDatasetToDelete(ds)
      setDeleteModalOpen(true)
    } else if (action === 'navigate') {
      router.push(`/organization-admin/dashboard/datasets/${id}`)
    } else if (action === 'preview' || action === 'analyze') {
      const ds = datasets.find(d => d.id === id)
      setSelectedDatasetId(id)
      setSelectedDatasetName(ds?.name || "")
      setIsAnalyticsOpen(true)
    } else if (['ai-excel', 'dashboard'].includes(action)) {
      await executeWorkflow(id, action)
    }
  }

  const confirmDelete = async () => {
    if (!datasetToDelete) return
    try {
      setIsDeleting(true)
      await api.delete(`/tenant-datasets/${datasetToDelete.id}`)
      toast.success("Dataset archived successfully")
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-md">
              <Database className="w-6 h-6" />
            </div>
            Data Catalog & Enterprise Center
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ingest, govern, and run AI processing workflows on your organization datasets.
          </p>
        </div>

        <button
          onClick={() => refreshAll()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Sync Data'}
        </button>
      </div>

      {/* KPI Cards */}
      {!loadingStats && <DatasetExecutiveKPIs stats={stats} />}

      {/* Quick Actions */}
      <DatasetQuickActions onAction={handleQuickAction} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Left Column (Search & Table) */}
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

        {/* Right Sidebar (Timeline) */}
        <div className="lg:col-span-1">
          <DatasetAuditTimeline 
            activities={activities} 
            loading={loadingActivities} 
          />
        </div>
      </div>
      
      <DatasetActionModal 
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        action={currentAction}
        datasets={datasets}
        onConfirm={executeWorkflow}
      />

      <DatasetAnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        datasetId={selectedDatasetId}
        datasetName={selectedDatasetName}
      />

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

