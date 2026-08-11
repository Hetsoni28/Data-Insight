import React from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  datasetName?: string
  loading?: boolean
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  datasetName,
  loading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Warning Icon Badge */}
          <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl mb-4 shadow-sm">
            <Trash2 className="w-7 h-7" />
          </div>

          {/* Modal Header */}
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Delete & Archive Dataset
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4 leading-relaxed">
            Are you sure you want to delete this dataset? This action will archive the dataset and remove it from your active catalog view.
          </p>

          {/* Target Dataset Name Badge */}
          {datasetName && (
            <div className="w-full px-3.5 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-6">
              {datasetName}
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200/60 dark:border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Deleting...</span>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
