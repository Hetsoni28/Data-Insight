"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Loader2, Circle, AlertCircle, Cpu, HardDrive, Sparkles, ShieldCheck } from "lucide-react"

export type ProcessingStatus = "idle" | "uploading" | "queued" | "profiling" | "ready" | "error"

interface DatasetProcessingStepperProps {
  status: ProcessingStatus
  filename: string
  errorMessage?: string
}

const STEPS = [
  { 
    id: "uploading", 
    label: "Uploading Dataset Stream", 
    desc: "Encrypting & storing dataset chunks in cloud workspace storage",
    icon: HardDrive 
  },
  { 
    id: "queued", 
    label: "Queued for Asynchronous Worker", 
    desc: "Enqueued in Celery processing pipeline with dedicated queue priority",
    icon: Cpu 
  },
  { 
    id: "profiling", 
    label: "Schema Extraction & Profiling", 
    desc: "Analyzing data types, statistical distributions, and health metrics",
    icon: Sparkles 
  },
  { 
    id: "ready", 
    label: "Finalizing & Indexing", 
    desc: "Constructing indices & unlocking AI Copilot workspace access",
    icon: ShieldCheck 
  }
]

export function DatasetProcessingStepper({ status, filename, errorMessage }: DatasetProcessingStepperProps) {
  const getProgressPercentage = () => {
    switch (status) {
      case "uploading": return 25
      case "queued": return 50
      case "profiling": return 75
      case "ready": return 100
      case "error": return 100
      default: return 0
    }
  }

  const getStepState = (stepId: string, currentIndex: number) => {
    const statusIndex = STEPS.findIndex(s => s.id === status)
    
    if (status === "error") {
      if (currentIndex < statusIndex || (statusIndex === -1 && stepId === "uploading")) return "complete"
      if (currentIndex === statusIndex || (statusIndex === -1 && currentIndex === 0)) return "error"
      return "pending"
    }

    if (status === "ready") return "complete"
    
    if (currentIndex < statusIndex) return "complete"
    if (currentIndex === statusIndex) return "current"
    return "pending"
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/5 relative overflow-hidden"
    >
      {/* Subtle glowing accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingestion Pipeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate max-w-sm">
            Target: <span className="font-semibold text-slate-700 dark:text-slate-200">{filename}</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {getProgressPercentage()}%
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Pipeline Progress</p>
        </div>
      </div>

      {/* Top Animated Progress Line */}
      <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-8">
        <motion.div 
          className={`h-full ${status === "error" ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"}`}
          initial={{ width: 0 }}
          animate={{ width: `${getProgressPercentage()}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>

      {/* Stepper Timeline */}
      <div className="space-y-6 relative before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {STEPS.map((step, index) => {
          const state = getStepState(step.id, index)
          const Icon = step.icon
          
          return (
            <motion.div 
              key={step.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              <div className={`
                flex items-center justify-center w-9 h-9 rounded-xl ring-4 ring-white dark:ring-slate-900 z-10 shrink-0 transition-all duration-300 shadow-sm
                ${state === "complete" ? "bg-emerald-500 text-white shadow-emerald-500/20" : ""}
                ${state === "current" ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 scale-110" : ""}
                ${state === "pending" ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5" : ""}
                ${state === "error" ? "bg-red-500 text-white shadow-red-500/20" : ""}
              `}>
                {state === "complete" && <CheckCircle2 className="w-5 h-5" />}
                {state === "current" && <Loader2 className="w-5 h-5 animate-spin" />}
                {state === "pending" && <Icon className="w-4 h-4" />}
                {state === "error" && <AlertCircle className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${
                    state === "complete" ? "text-slate-900 dark:text-white" :
                    state === "current" ? "text-emerald-600 dark:text-emerald-400" :
                    state === "error" ? "text-red-600 dark:text-red-400" :
                    "text-slate-400 dark:text-slate-500"
                  }`}>
                    {step.label}
                  </h4>

                  {state === "current" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      PROCESSING
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {step.desc}
                </p>

                {state === "error" && errorMessage && (
                  <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
