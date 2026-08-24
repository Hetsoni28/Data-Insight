"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Database, ShieldCheck, Sparkles, Cpu, Zap, Lock } from "lucide-react"

import { DatasetFileDropzone } from "./DatasetFileDropzone"
import { DatasetConfiguration } from "./DatasetConfiguration"
import { DatasetProcessingStepper, ProcessingStatus } from "./DatasetProcessingStepper"
import { DatasetReadySummary } from "./DatasetReadySummary"
import { DataQualityReview } from "../DataQualityReview"

interface DatasetIngestionWorkspaceProps {
  role: "owner" | "org_admin" | "organization-admin" | "manager" | "analyst" | "viewer"
}

export function DatasetIngestionWorkspace({ role }: DatasetIngestionWorkspaceProps) {
  const pathname = usePathname()
  const roleMatch = pathname?.match(/^\/(owner|organization-admin|manager|analyst|viewer)/)
  const dynamicBasePath = roleMatch ? `${roleMatch[0]}/dashboard` : "/analyst/dashboard"
  const router = useRouter()
  const { activeWs } = useWorkspaceStore()

  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  
  const [status, setStatus] = useState<ProcessingStatus>("idle")
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  
  const [finalStats, setFinalStats] = useState<{
    row_count: number
    column_count: number
    data_quality_score: number
    profile?: any
  } | null>(null)

  // Polling logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const pollStatus = async () => {
      if (!datasetId || status === "idle" || status === "uploading" || status === "ready" || status === "error") {
        return
      }

      try {
        const res = await api.get(`/tenant-datasets/${datasetId}`)
        const data = res.data.data
        
        if (data.status === "error" || data.status === "failed") {
          setStatus("error")
          setErrorMessage(data.error_message || "Dataset processing failed. Please try again.")
        } else if (data.status === "ready") {
          setStatus("ready")
          setFinalStats({
            row_count: data.row_count || 0,
            column_count: data.column_count || 0,
            data_quality_score: data.data_quality_score || 0,
            profile: data.profile || {}
          })
        } else if (data.status === "profiling") {
          setStatus("profiling")
          timeoutId = setTimeout(pollStatus, 3000)
        } else {
          setStatus("queued")
          timeoutId = setTimeout(pollStatus, 3000)
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setStatus("error")
          setErrorMessage("Session expired. Please log in again.")
        } else if (err.response?.status === 403) {
          setStatus("error")
          setErrorMessage("Permission denied. You cannot access this dataset.")
        } else if (err.response?.status === 404) {
          setStatus("error")
          setErrorMessage("Dataset was deleted or not found.")
        } else {
          timeoutId = setTimeout(pollStatus, 5000)
        }
      }
    }

    pollStatus()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [datasetId, status])

  const handleUpload = async () => {
    if (!file || !name.trim()) {
      toast.error("Please select a file and enter a dataset name.")
      return
    }

    if (!activeWs?.id) {
      toast.error("No active workspace selected.")
      return
    }

    setStatus("uploading")
    setErrorMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("workspace_id", activeWs.id)
      formData.append("name", name)
      if (description) formData.append("description", description)

      const res = await api.post("/datasets/upload", formData)
      
      setDatasetId(res.data.id)
      setStatus("queued")
    } catch (err: any) {
      setStatus("error")
      if (err.response?.status === 400 || err.response?.status === 402) {
        setErrorMessage(err.response?.data?.detail || "Storage limit reached for this workspace.")
        toast.error(err.response?.data?.detail || "Storage limit reached.")
      } else {
        setErrorMessage(err.response?.data?.detail || "Failed to upload file.")
        toast.error("Failed to upload file.")
      }
    }
  }

  const handleReset = () => {
    setFile(null)
    setName("")
    setDescription("")
    setStatus("idle")
    setDatasetId(null)
    setErrorMessage("")
    setFinalStats(null)
  }

  const handleExplore = () => {
    router.push(`${dynamicBasePath}/datasets?datasetId=${datasetId}`)
  }

  const handleAnalyze = () => {
    router.push(`${dynamicBasePath}/datasets?datasetId=${datasetId}&openAnalytics=true`)
  }

  const isFormDisabled = status !== "idle" && status !== "error"

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-[calc(100vh-6rem)] flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-900/5"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-64 h-64 text-emerald-500" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/25 shrink-0">
                <Database className="w-7 h-7" />
              </div>
              Production Dataset Ingestion
            </h1>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium">
              Upload raw spreadsheets or structured datasets directly into your secure tenant storage pipeline with automated schema profiling and AI copilot indexing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-AI Profiling</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Column: Form & Configuration (5 cols) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`lg:col-span-5 space-y-6 transition-all duration-300 ${status === "ready" ? "opacity-60 pointer-events-none" : ""}`}
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-white/10 space-y-6 shadow-xl shadow-slate-900/5">
            
            <DatasetFileDropzone 
              file={file} 
              onFileSelect={(f) => {
                setFile(f)
                if (!name) setName(f.name.split('.')[0].replace(/[-_]/g, ' '))
              }} 
              onRemove={() => setFile(null)} 
              disabled={isFormDisabled}
            />

            <DatasetConfiguration 
              name={name} 
              setName={setName} 
              description={description} 
              setDescription={setDescription} 
              disabled={isFormDisabled}
            />

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Target Workspace</span>
                <span className="px-3 py-1 rounded-lg font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {activeWs?.name || "Select Workspace"}
                </span>
              </div>
              
              {status === "idle" || status === "error" ? (
                <button 
                  onClick={handleUpload}
                  disabled={!file || !name.trim() || !activeWs}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all flex items-center justify-center gap-2 group"
                >
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Initiate Data Ingestion
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Dynamic Pipeline Status & Showcase (7 cols) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-6 flex flex-col"
        >
          {(status !== "idle" || errorMessage) && status !== "ready" && (
            <DatasetProcessingStepper 
              status={status} 
              filename={file?.name || name || "Dataset"} 
              errorMessage={errorMessage}
            />
          )}

          {status === "ready" && finalStats && (
            <DataQualityReview
              datasetId={datasetId!}
              datasetName={name || file?.name || "Dataset"}
              rowCount={finalStats.row_count}
              columnCount={finalStats.column_count}
              profile={finalStats.profile}
              role={role}
              onExplore={handleExplore}
              onAnalyze={handleAnalyze}
              onUploadAnother={handleReset}
            />
          )}

          {/* Idle State: Feature Showcase */}
          {status === "idle" && !errorMessage && (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 flex-1 flex flex-col justify-between shadow-xl shadow-slate-900/5 min-h-[500px]">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  What happens after ingestion?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mb-8 font-medium">
                  Your dataset undergoes zero-copy validation and automatic indexing before becoming instantly queryable by your workspace team.
                </p>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-emerald-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Automatic AI Profiling</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Calculates row count, null ratios, and quality health scores automatically.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-teal-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Multi-Tenant Isolation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Strict workspace RBAC ensures data is only accessible to authorized team members.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">DuckDB High Speed</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      In-memory analytical queries for sub-second chart rendering and AI analysis.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 hover:border-purple-500/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Audit Traceability</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Every dataset creation, modification, and query is logged for compliance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        
      </div>
    </div>
  )
}
