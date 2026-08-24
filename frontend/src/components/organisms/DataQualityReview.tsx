"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2, ShieldCheck, Sparkles, Download, ArrowRight,
  ShieldAlert, FileWarning, Fingerprint, Lock, BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"

interface DataQualityReviewProps {
  datasetId: string
  datasetName: string
  rowCount: number
  columnCount: number
  profile: any
  role: string
  onExplore: () => void
  onAnalyze: () => void
  onUploadAnother: () => void
}

export function DataQualityReview({
  datasetId,
  datasetName,
  rowCount,
  columnCount,
  profile,
  role,
  onExplore,
  onAnalyze,
}: DataQualityReviewProps) {
  const [isCleaning, setIsCleaning] = useState(false)

  const handleCleanAndDownload = async () => {
    setIsCleaning(true)
    try {
      const res = await api.post(`/tenant-datasets/${datasetId}/clean`)
      const metrics = res.data.metrics ?? {}
      toast.success(
        `Cleaned! Removed ${metrics.duplicates_removed ?? 0} duplicates & ${metrics.empty_rows_removed ?? 0} blank rows.`
      )
      try {
        const dlRes = await api.get(`/tenant-datasets/${datasetId}/download-url`)
        if (dlRes.data?.download_url) {
          const link = document.createElement("a")
          link.href = dlRes.data.download_url
          link.download = `cleaned_${datasetName}.xlsx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          return
        }
      } catch {
        // fallthrough
      }
      toast.info("Cleaned dataset saved. Redirecting to explorer...")
      setTimeout(() => onExplore(), 1500)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to clean dataset.")
    } finally {
      setIsCleaning(false)
    }
  }

  const duplicates: number = profile?.duplicate_rows ?? 0
  const sparsity: number = profile?.sparsity_pct ?? 0
  const qualityScore: number | null = profile?.quality_score ?? null
  const qualityGrade: string | null = profile?.quality_grade ?? null

  const outlierCount: number = profile?.columns
    ? Object.values(profile.columns as Record<string, any>)
        .filter((c: any) => c.type === "numeric")
        .reduce((sum: number, c: any) => sum + (c.outlier_count ?? 0), 0)
    : 0

  const hasIssues = duplicates > 0 || sparsity > 5 || outlierCount > 0
  const canUseAI = ["owner", "org_admin", "organization-admin"].includes(role)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 text-left space-y-8 relative overflow-hidden"
    >
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 relative z-10 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Data Quality Review</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {datasetName} &bull; {rowCount.toLocaleString()} rows &bull; {columnCount} columns
            </p>
          </div>
        </div>
        {qualityScore !== null && (
          <div className={`flex flex-col items-center px-4 py-2 rounded-2xl border shrink-0 ${qualityScore >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : qualityScore >= 60 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"}`}>
            <span className={`text-2xl font-black ${qualityScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : qualityScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{qualityGrade}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score: {qualityScore}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${duplicates > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {duplicates > 0 ? <Fingerprint className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <span className={duplicates > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>Duplicates</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{duplicates.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Exact duplicate rows</p>
        </div>
        <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${sparsity > 5 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {sparsity > 5 ? <FileWarning className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <span className={sparsity > 5 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>Null / Missing</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{sparsity}%</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Missing data cells</p>
        </div>
        <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${outlierCount > 0 ? "bg-orange-500/10 border-orange-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {outlierCount > 0 ? <BarChart3 className="w-4 h-4 text-orange-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <span className={outlierCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}>Outliers</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{outlierCount.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Statistical anomalies (IQR)</p>
        </div>
      </div>

      {hasIssues && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 relative z-10">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            Structural issues detected. Clean this dataset before running heavy AI analytics for best results.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
        <Button onClick={handleCleanAndDownload} disabled={isCleaning} variant="outline" className="flex-1 h-12 rounded-xl text-slate-700 dark:text-white border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold shadow-sm">
          {isCleaning ? (<span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> Cleaning...</span>) : (<><Download className="w-4 h-4 mr-2" />Clean &amp; Export Excel</>)}
        </Button>
        <div className="flex-1 relative group">
          <Button onClick={onAnalyze} disabled={!canUseAI} className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold shadow-lg shadow-indigo-500/25 transition-all">
            {canUseAI ? (<><Sparkles className="w-4 h-4 mr-2" />Proceed to AI Analytics<ArrowRight className="w-4 h-4 ml-2" /></>) : (<><Lock className="w-4 h-4 mr-2 opacity-70" />AI Analytics (Admin Only)</>)}
          </Button>
          {!canUseAI && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Requires Admin Privileges to run AI on raw data.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center relative z-10">
        <button onClick={onExplore} className="text-sm text-slate-500 hover:text-emerald-500 font-medium transition-colors">
          Skip &rarr; Explore Dataset
        </button>
      </div>
    </motion.div>
  )
}
