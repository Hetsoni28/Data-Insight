"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { Database } from "lucide-react"
import { toast } from "sonner"

import { DatasetExecutiveKPIs } from "@/components/organisms/DatasetExecutiveKPIs"
import { DatasetQuickActions } from "@/components/organisms/DatasetQuickActions"
import { DatasetEnterpriseSearch } from "@/components/organisms/DatasetEnterpriseSearch"
import { DatasetExplorerTable } from "@/components/organisms/DatasetExplorerTable"
import { DatasetAuditTimeline } from "@/components/organisms/DatasetAuditTimeline"
import { DatasetActionModal } from "@/components/organisms/DatasetActionModal"
import { DatasetAnalyticsDrawer } from "@/components/organisms/DatasetAnalyticsDrawer"

export default function DatasetCenterPage() {
  const { data: user } = useAuth()
  const { setIsUploadOpen } = useWorkspaceStore()
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

  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingDatasets, setLoadingDatasets] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchActivities()
  }, [])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchDatasets()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    // Auto-poll if any dataset is currently processing
    const hasProcessing = datasets.some(d => d.status === 'processing' || d.status === 'uploading' || d.status === 'profiling')
    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchDatasets(true)
        fetchStats(true)
        fetchActivities(true)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [datasets])

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoadingStats(true)
      const res = await api.get("/tenant-datasets/stats")
      setStats(res.data.data)
    } catch (e) {
      console.error(e)
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
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoadingDatasets(false)
    }
  }

  const fetchActivities = async (silent = false) => {
    try {
      if (!silent) setLoadingActivities(true)
      const res = await api.get("/tenant-datasets/activities")
      // Combine audit and AI activities and sort by date descending
      const combined = [
        ...(res.data.data.audit_logs || []),
        ...(res.data.data.ai_activities || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setActivities(combined.slice(0, 15)) // Keep top 15
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoadingActivities(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    if (action === 'upload') {
      setIsUploadOpen(true)
    } else {
      setCurrentAction(action)
      setActionModalOpen(true)
    }
  }

  const executeWorkflow = async (datasetId: string, action: string) => {
    try {
      const promise = api.post(`/tenant-datasets/${datasetId}/${action}`)
      toast.promise(promise, {
        loading: `Starting ${action.replace('-', ' ')}...`,
        success: `Successfully started ${action.replace('-', ' ')} workflow!`,
        error: `Failed to start ${action.replace('-', ' ')}.`
      })
      
      await promise
      fetchDatasets()
      fetchStats()
      fetchActivities()
    } catch (e) {
      console.error(`Failed to start ${action} workflow`, e)
    }
  }

  const handleRowAction = async (action: string, id: string) => {
    if (action === 'delete') {
      if (!confirm("Are you sure you want to delete this dataset?")) return
      try {
        await api.delete(`/tenant-datasets/${id}`)
        toast.success("Dataset deleted")
        fetchDatasets()
        fetchStats()
        fetchActivities()
      } catch (e) {
        console.error("Failed to delete dataset", e)
        toast.error("Failed to delete dataset")
      }
    } else if (action === 'preview' || action === 'analyze') {
      const ds = datasets.find(d => d.id === id)
      setSelectedDatasetId(id)
      setSelectedDatasetName(ds?.name || "")
      setIsAnalyticsOpen(true)
    } else if (['ai-excel', 'dashboard'].includes(action)) {
      await executeWorkflow(id, action)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            Dataset Center
          </h1>
          <p className="mt-2 text-slate-500">
            Upload, organize, and analyze datasets for AI-powered business intelligence.
          </p>
        </div>
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
    </div>
  )
}
