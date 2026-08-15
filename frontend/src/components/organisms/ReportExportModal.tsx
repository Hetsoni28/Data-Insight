"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, FileJson, Loader2, X } from "lucide-react"
import { toast } from "sonner"

export function ReportExportModal({ isOpen, onClose, reportId, onExport }: { isOpen: boolean, onClose: () => void, reportId: string, onExport: (format: string) => Promise<void> }) {
  const [format, setFormat] = useState("csv")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    setLoading(true)
    try {
      await onExport(format)
      toast.success(`Report exported as ${format.toUpperCase()}`)
      onClose()
    } catch (e) {
      toast.error("Export failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Download className="w-5 h-5 text-emerald-500" /> Export Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">Select the format you wish to export the data as:</p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setFormat('csv')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === 'csv' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              <FileText className="w-6 h-6" /> <span className="text-xs font-semibold">CSV</span>
            </button>
            <button onClick={() => setFormat('json')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === 'json' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              <FileJson className="w-6 h-6" /> <span className="text-xs font-semibold">JSON</span>
            </button>
            <button onClick={() => setFormat('pdf')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === 'pdf' ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
              <FileText className="w-6 h-6" /> <span className="text-xs font-semibold">PDF</span>
            </button>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleExport} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
          </button>
        </div>
      </div>
    </div>
  )
}
