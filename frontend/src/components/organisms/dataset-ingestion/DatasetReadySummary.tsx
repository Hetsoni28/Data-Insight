"use client"

import { motion } from "framer-motion"
import { CheckCircle2, LayoutGrid, Rows, ShieldCheck, Sparkles, BarChart2, Plus, ArrowRight, Database } from "lucide-react"

interface DatasetReadySummaryProps {
  datasetName: string
  rowCount: number
  columnCount: number
  qualityScore: number
  onExplore: () => void
  onAnalyze: () => void
  onUploadAnother: () => void
}

export function DatasetReadySummary({
  datasetName,
  rowCount,
  columnCount,
  qualityScore,
  onExplore,
  onAnalyze,
  onUploadAnother
}: DatasetReadySummaryProps) {
  const getQualityColor = (score: number) => {
    if (score >= 90) return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" }
    if (score >= 70) return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" }
    return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" }
  }

  const qualityColor = getQualityColor(qualityScore)

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 text-center space-y-8 relative overflow-hidden"
    >
      {/* Radiant Top Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-2 relative"
        >
          <CheckCircle2 className="w-10 h-10" />
          <div className="absolute -inset-1 rounded-3xl bg-emerald-500/30 animate-pulse -z-10" />
        </motion.div>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
          Ingestion Complete
        </span>

        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dataset Ready</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          <span className="font-bold text-slate-900 dark:text-white">{datasetName}</span> has been indexed and structured. AI profiling and statistical metrics are fully calculated.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto relative z-10">
        <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:scale-[1.02] transition-transform">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <Rows className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{rowCount.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Rows</p>
        </div>

        <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:scale-[1.02] transition-transform">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{columnCount.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Columns</p>
        </div>

        <div className={`bg-slate-50/80 dark:bg-white/5 border ${qualityColor.border} rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:scale-[1.02] transition-transform`}>
          <div className={`w-9 h-9 rounded-xl ${qualityColor.bg} ${qualityColor.text} flex items-center justify-center mb-2`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className={`text-2xl font-black ${qualityColor.text} font-mono`}>{qualityScore.toFixed(1)}%</p>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Quality Health</p>
        </div>
      </div>

      {/* Actionable Next Steps */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5 max-w-xl mx-auto relative z-10">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recommended Next Actions</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={onExplore}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <Database className="w-4 h-4" />
            Explore Dataset & Schema
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-auto" />
          </button>

          <button 
            onClick={onAnalyze}
            className="w-full py-3.5 px-5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Launch AI Copilot
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-auto" />
          </button>
        </div>

        <button 
          onClick={onUploadAnother}
          className="w-full py-2.5 px-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 pt-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Upload Another Dataset to Workspace
        </button>
      </div>
    </motion.div>
  )
}
