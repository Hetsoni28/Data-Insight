"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, FileSpreadsheet, CheckCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface DatasetFileDropzoneProps {
  file: File | null
  onFileSelect: (file: File) => void
  onRemove: () => void
  disabled: boolean
}

const VALID_TYPES = [
  "text/csv", 
  "application/json", 
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/tab-separated-values"
]

const FORMAT_TAGS = [
  { name: "CSV", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { name: "XLSX", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" },
  { name: "JSON", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { name: "PARQUET", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { name: "TSV", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
]

export function DatasetFileDropzone({ file, onFileSelect, onRemove, disabled }: DatasetFileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0])
    }
  }

  const validateAndSelect = (selectedFile: File) => {
    const isExtensionValid = selectedFile.name.endsWith('.csv') || 
                             selectedFile.name.endsWith('.json') || 
                             selectedFile.name.endsWith('.xlsx') ||
                             selectedFile.name.endsWith('.tsv') ||
                             selectedFile.name.endsWith('.parquet')

    if (!VALID_TYPES.includes(selectedFile.type) && !isExtensionValid) {
      toast.error("Please upload a supported CSV, JSON, XLSX, TSV, or Parquet file.")
      return
    }
    
    const MAX_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB
    if (selectedFile.size > MAX_SIZE) {
      toast.error("File exceeds the 2 GB maximum size limit. Please split your dataset and upload in parts.")
      return
    }

    onFileSelect(selectedFile)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          Data Source File
        </label>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Max size: 2 GB</span>
      </div>

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-slate-900/5 dark:from-emerald-950/30 dark:to-slate-900/50 p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
          >
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                      READY
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-3 h-3" /> Validated
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={(e) => { e.preventDefault(); onRemove() }}
                disabled={disabled}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all disabled:opacity-50 shrink-0 border border-transparent hover:border-red-500/20"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="file-dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-8 md:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[260px] ${
              disabled ? "opacity-60 cursor-not-allowed bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10" : "cursor-pointer"
            } ${
              isDragging 
                ? "border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10 scale-[1.01]" 
                : !disabled 
                ? "border-slate-200 dark:border-white/10 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 hover:bg-slate-50/80 dark:hover:bg-slate-900/60 shadow-sm hover:shadow-md" 
                : ""
            }`}
          >
            {/* Ambient background glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-teal-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => {
                if (e.target.files?.[0]) validateAndSelect(e.target.files[0])
              }}
              className="hidden" 
              disabled={disabled}
              accept=".csv, .xlsx, .json, .tsv, .parquet, text/csv, application/json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />

            <motion.div 
              animate={{ y: isDragging ? -4 : 0 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all shadow-md ${
                isDragging 
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 scale-110" 
                  : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-emerald-500/20"
              }`}
            >
              <Upload className="h-7 w-7" />
            </motion.div>

            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Click to upload or drag and drop
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
              Drop your tabular or structured data file here to initiate automated schema analysis.
            </p>

            {/* Format Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5 w-full">
              {FORMAT_TAGS.map((tag) => (
                <span 
                  key={tag.name} 
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${tag.color}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
