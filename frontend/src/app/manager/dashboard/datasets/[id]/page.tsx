"use client"
import { useEffect, useState, useCallback } from "react"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useParams, useRouter } from "next/navigation"
import { managerDatasetsService } from "@/lib/manager-datasets.service"
import { ArrowLeft, Database, Settings, Activity, FileText } from "lucide-react"

import { ManagerDatasetPreview } from "@/components/organisms/ManagerDatasetPreview"
import { ManagerActivityFeed } from "@/components/organisms/ManagerActivityFeed" // Reusing the one created earlier

export default function ManagerDatasetDetail() {
  const { id } = useParams()
  const router = useRouter()
  
  const [dataset, setDataset] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!id || id === "upload") return
    setLoading(true)
    try {
      const [datasetRes, previewRes, activityRes] = await Promise.all([
        managerDatasetsService.getDatasetDetails(id as string),
        managerDatasetsService.getDatasetPreview(id as string),
        managerDatasetsService.getDatasetActivity(id as string)
      ])
      
      setDataset(datasetRes.data || datasetRes) // Adjust based on exact response format
      setPreview(previewRes.data || previewRes)
      setActivity(activityRes.data || [])
    } catch (e) {
      console.error("Failed to fetch dataset details", e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id === "upload") {
      useWorkspaceStore.getState().setIsUploadOpen(true)
      router.replace("/manager/dashboard/datasets")
      return
    }
    fetchData()
  }, [fetchData, id, router])

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1800px] mx-auto space-y-8 min-h-screen">
        <div className="h-32 w-full rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[500px] rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-[500px] rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Dataset Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">The dataset may have been deleted or you don't have access.</p>
          <button onClick={() => router.back()} className="mt-6 px-4 py-2 bg-slate-100 dark:bg-white/10 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-[#09090b] min-h-screen pb-24">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Datasets
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121214] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-6 h-6 text-emerald-500" />
                {dataset.name}
              </h1>
              {dataset.description && (
                <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{dataset.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                dataset.status === 'ready' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                dataset.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
              }`}>
                {dataset.status === 'ready' ? 'Active' : dataset.status === 'profiling' ? 'Processing' : dataset.status}
              </span>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors">
                <FileText className="w-4 h-4" />
                Analyze
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rows</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{dataset.row_count?.toLocaleString() || '-'}</p>
          </div>
          <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Columns</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{dataset.column_count?.toLocaleString() || '-'}</p>
          </div>
          <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Size (MB)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{dataset.file_size_bytes ? (dataset.file_size_bytes / (1024 * 1024)).toFixed(2) : '-'}</p>
          </div>
          <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quality Score</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{dataset.data_quality_score ? `${dataset.data_quality_score}%` : '-'}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ManagerDatasetPreview preview={preview} loading={loading} />
          </div>
          
          <div className="lg:col-span-1">
            <ManagerActivityFeed activity={activity} />
          </div>
        </div>

      </div>
    </div>
  )
}
