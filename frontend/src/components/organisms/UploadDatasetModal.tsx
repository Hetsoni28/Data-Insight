"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, FileType, CheckCircle2, Loader2, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/lib/api"

interface UploadDatasetModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onSuccess?: () => void
}

export function UploadDatasetModal({ isOpen, onClose, workspaceId, onSuccess }: UploadDatasetModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  const handleFileSelection = (selectedFile: File) => {
    const validTypes = [
      "text/csv", 
      "application/json", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.xlsx')) {
      toast.error("Please upload a CSV, JSON, or XLSX file.")
      return
    }
    setFile(selectedFile)
    // Auto-fill name if empty
    if (!name) {
      setName(selectedFile.name.split('.')[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !workspaceId) return
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("workspace_id", workspaceId)
      if (name) formData.append("name", name)
      if (description) formData.append("description", description)

      await api.post("/datasets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      toast.success("Dataset uploaded successfully!")
      setFile(null)
      setName("")
      setDescription("")
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || "Failed to upload dataset.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) return
    setFile(null)
    setName("")
    setDescription("")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white dark:bg-white/5 w-full max-w-md rounded-2xl shadow-xl overflow-hidden pointer-events-auto border border-slate-200/60 dark:border-white/10"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">Upload Dataset</h2>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Upload a CSV, JSON, or XLSX file for AI analysis</p>
                </div>
                <button 
                  onClick={handleClose}
                  disabled={isUploading}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {!file ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "border-slate-200 dark:border-white/10 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileSelection(e.target.files[0])
                      }}
                      className="hidden" 
                      accept=".csv, .xlsx, .json, text/csv, application/json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    />
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      isDragging ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-white/10 text-slate-400"
                    }`}>
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-[14px] font-medium text-slate-700 dark:text-slate-300 mb-1">Click to upload or drag and drop</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">CSV, XLSX, or JSON (max 50MB)</p>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Selected File Card */}
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button 
                        onClick={() => setFile(null)}
                        disabled={isUploading}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dataset Name <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl text-[13px] outline-none focus:bg-white dark:bg-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          placeholder="e.g. Q3 Sales Data"
                          disabled={isUploading}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <textarea 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl text-[13px] outline-none focus:bg-white dark:bg-white/5 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                          placeholder="Brief description of the dataset contents..."
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isUploading}
                  className="h-9 px-4 text-[13px] border-slate-200/60 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!file || !name.trim() || isUploading}
                  className="h-9 px-5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm shadow-emerald-500/20 border-t border-emerald-400 rounded-xl font-medium text-[13px] gap-2 transition-all"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {isUploading ? "Uploading..." : "Upload & Analyze"}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
