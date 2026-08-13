"use client"

import { useState, useEffect } from "react"
import { Clock, Download, Share2, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
    if (action.includes('generated') || action.includes('started')) return <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    if (action.includes('download')) return <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    if (action.includes('share')) return <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
    if (action.includes('ready')) return <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
    if (action.includes('failed') || action.includes('error')) return <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
    return <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('generated') || action.includes('started')) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-500/5"
    if (action.includes('download')) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-500/5"
    if (action.includes('share')) return "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-500/5"
    if (action.includes('ready')) return "bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30 ring-4 ring-teal-50 dark:ring-teal-500/5"
    if (action.includes('failed') || action.includes('error')) return "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 ring-4 ring-rose-50 dark:ring-rose-500/5"
    return "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 ring-4 ring-slate-50 dark:ring-slate-800/50"
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
    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 w-full flex flex-col h-full shadow-sm relative overflow-hidden">
      
      {/* Decorative gradient blur */}
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
          <Clock className="w-4 h-4 mr-2 text-emerald-500" />
          Recent Activity
        </h3>
      </div>
      
      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
        {isLoading ? (
          <div className="flex flex-col gap-6 animate-pulse mt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700/50 shrink-0"></div>
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700/50 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedLogs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-slate-500 py-12"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No recent activity</p>
          </motion.div>
        ) : (
          <div className="relative border-l border-dashed border-slate-200 dark:border-slate-700 ml-[15px] space-y-6 pb-2 pt-2">
            <AnimatePresence mode="popLayout">
              {paginatedLogs.map((log, index) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-7 group"
                >
                  <span className={`absolute -left-[15px] top-0.5 flex items-center justify-center w-7 h-7 rounded-full border shadow-sm transition-transform duration-300 group-hover:scale-110 ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </span>
                  
                  <div className="flex flex-col group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {formatAction(log.action)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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
