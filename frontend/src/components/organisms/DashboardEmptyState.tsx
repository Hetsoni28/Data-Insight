"use client"
import { motion } from "framer-motion"
import { Upload, FileSpreadsheet, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardEmptyState({ onUploadClick }: { onUploadClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-12 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]"
    >
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.3]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-6"
        >
          <Sparkles className="h-7 w-7 text-emerald-500" />
        </motion.div>
        
        <motion.h2 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-slate-900 tracking-tight mb-3"
        >
          Let's bring your data to life
        </motion.h2>
        
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[15px] text-slate-500 max-w-md mx-auto mb-8 leading-relaxed"
        >
          Upload a CSV, XLSX, or JSON file and our AI will automatically profile it, find hidden insights, and generate a board-ready report in seconds.
        </motion.p>
        
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-4"
        >
          <Button
            onClick={onUploadClick}
            className="h-11 px-6 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm shadow-emerald-500/20 border-t border-emerald-400 rounded-xl font-medium text-[14px] gap-2 transition-all"
          >
            <Upload className="h-4 w-4" />
            Upload first dataset
          </Button>
          <Button
            variant="outline"
            className="h-11 px-6 text-[14px] font-medium border-slate-200/60 rounded-xl gap-2 hover:bg-slate-50 transition-colors text-slate-700 shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-400" />
            View sample report
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}
