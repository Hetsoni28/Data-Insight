"use client"

import { useState, useEffect } from "react"
import { Clock, Download, Share2, FileText, CheckCircle2 } from "lucide-react"
import { PaginationControls } from "@/components/molecules/PaginationControls"

interface AuditLog {
  id: string
  action: string
  created_at: string
}

interface ReportAuditTimelineProps {
  logs: AuditLog[]
  isLoading: boolean
}

export function ReportAuditTimeline({ logs, isLoading }: ReportAuditTimelineProps) {
  const getActionIcon = (action: string) => {
    if (action.includes('generated') || action.includes('started')) return <FileText className="w-4 h-4 text-indigo-600" />
    if (action.includes('download')) return <Download className="w-4 h-4 text-emerald-600" />
    if (action.includes('share')) return <Share2 className="w-4 h-4 text-blue-600" />
    if (action.includes('ready')) return <CheckCircle2 className="w-4 h-4 text-green-600" />
    return <Clock className="w-4 h-4 text-slate-600" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('generated') || action.includes('started')) return "bg-indigo-50 border-indigo-200"
    if (action.includes('download')) return "bg-emerald-50 border-emerald-200"
    if (action.includes('share')) return "bg-blue-50 border-blue-200"
    if (action.includes('ready')) return "bg-green-50 border-green-200"
    return "bg-slate-50 border-slate-200"
  }

  const formatAction = (action: string) => {
    return action.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const totalPages = Math.ceil((logs?.length || 0) / itemsPerPage)
  const paginatedLogs = logs?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 w-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-slate-400" />
          Recent Activity
        </h3>
      </div>
      
      <div className="overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6">
            {paginatedLogs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <span className={`absolute -left-[17px] top-1 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white dark:bg-slate-900 ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </span>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatAction(log.action)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && logs.length > 0 && (
        <div className="mt-4 pt-2 shrink-0">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={logs.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {}}
            pageSizeOptions={[5]}
          />
        </div>
      )}
    </div>
  )
}
