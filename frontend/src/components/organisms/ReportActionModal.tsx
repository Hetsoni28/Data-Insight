"use client"

import { useState, useEffect } from "react"
import { X, Search, FileText, Database } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface Dataset {
  id: string
  name: string
  status: string
}

interface ReportActionModalProps {
  isOpen: boolean
  onClose: () => void
  actionType: string
  onSuccess: () => void
}

export function ReportActionModal({ isOpen, onClose, actionType, onSuccess }: ReportActionModalProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [search, setSearch] = useState("")
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [reportTitle, setReportTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getActionLabel = () => {
    switch(actionType) {
      case 'excel': return 'Generate AI Excel Workbook'
      case 'executive': return 'Generate Executive Summary'
      case 'ai-insight': return 'Generate AI Analysis'
      case 'dashboard': return 'Create BI Dashboard'
      case 'forecast': return 'Generate Trend Forecast'
      default: return `Generate ${actionType}`
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDatasets()
      setReportTitle(`New ${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Report`)
    }
  }, [isOpen, actionType])

  const fetchDatasets = async () => {
    try {
      const res = await api.get('/tenant-datasets')
      setDatasets(res.data.data.filter((d: Dataset) => d.status === 'ready'))
    } catch (e) {
      console.error("Failed to fetch datasets", e)
    }
  }

  const handleSubmit = async () => {
    if (!selectedDataset) {
      toast.error("Please select a dataset")
      return
    }
    
    setIsSubmitting(true)
    try {
      await api.post('/tenant-reports/generate', {
        dataset_id: selectedDataset,
        title: reportTitle,
        report_category: actionType,
        report_type: 'excel'
      })
      toast.success("Report generation started")
      onSuccess()
      onClose()
    } catch (e) {
      toast.error("Failed to start report generation")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const filtered = datasets.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">Generate {actionType}</h2>
              <p className="text-sm text-slate-500">Select a dataset to generate this report from.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Report Title</label>
            <input 
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Target Dataset</label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ready datasets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
            {filtered.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDataset(d.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedDataset === d.id 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Database className={`w-5 h-5 ${selectedDataset === d.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${selectedDataset === d.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {d.name}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">
                No ready datasets found
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDataset || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center"
          >
            {isSubmitting ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </div>
  )
}
