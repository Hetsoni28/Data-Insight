import React, { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ExecutiveReportViewer } from "./ExecutiveReportViewer"
import { AIDashboardViewer } from "./AIDashboardViewer"
import { BIDashboardViewer } from "./BIDashboardViewer"
import { TrendForecastViewer } from "./TrendForecastViewer"
import api from "@/lib/api"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface ReportViewerModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string | null
}

export function ReportViewerModal({ isOpen, onClose, reportId }: ReportViewerModalProps) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && reportId) {
      loadReport(reportId)
    } else {
      setReport(null)
    }
  }, [isOpen, reportId])

  const loadReport = async (id: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/tenant-reports/${id}`)
      setReport(res.data.data)
    } catch (e) {
      toast.error("Failed to load report data")
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[900px] max-h-[92vh] overflow-y-auto p-0 bg-white dark:bg-white/5 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-slate-500 font-medium text-sm">Loading AI Blueprint...</span>
          </div>
        ) : report ? (
          <div className="w-full">
            {report.status === 'generating' || report.status === 'queued' ? (
              <div className="flex flex-col items-center justify-center p-24 gap-4">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report is Generating</h3>
                <p className="text-slate-500 text-sm">This AI report is currently being generated. Please check back soon.</p>
              </div>
            ) : report.status === 'error' ? (
              <div className="flex flex-col items-center justify-center p-24 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-full text-red-600">
                  <X className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Generation Failed</h3>
                <p className="text-slate-500 text-sm">{report.error_message || "An unknown error occurred during generation."}</p>
              </div>
            ) : report.category === 'executive' ? (
              <ExecutiveReportViewer report={report} />
            ) : report.category === 'ai-insight' ? (
              <AIDashboardViewer report={report} />
            ) : report.category === 'dashboard' ? (
              <BIDashboardViewer report={report} />
            ) : report.category === 'forecast' ? (
              <TrendForecastViewer report={report} />
            ) : (
              <div className="text-center p-12 text-slate-500">
                Viewer for <strong>{report.category}</strong> is not yet implemented.
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
