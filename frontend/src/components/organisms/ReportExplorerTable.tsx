"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, Share2, MoreVertical, FileText, CheckCircle2, Clock, XCircle, FileSpreadsheet, Eye, Copy, Archive } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export interface Report {
  id: string
  title: string
  status: string
  report_type: string
  category: string
  created_at: string
  output_size_bytes: number
  dataset_id: string | null
}

interface ReportExplorerTableProps {
  reports: Report[]
  isLoading: boolean
  onAction: (action: string, id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export function ReportExplorerTable({ reports, isLoading, onAction, searchQuery, setSearchQuery }: ReportExplorerTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Ready</span>
      case 'generating':
      case 'queued':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 shadow-sm"><Clock className="w-3 h-3 mr-1.5 animate-spin-slow" /> Generating</span>
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20 shadow-sm"><XCircle className="w-3 h-3 mr-1.5" /> Failed</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-slate-100/80 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200/50 dark:border-slate-500/20 shadow-sm">{status}</span>
    }
  }

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [statusFilter, setStatusFilter] = useState("all")

  const filteredReports = reports?.filter(r => {
    const matchesSearch = !searchQuery || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || []

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  return (
    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/30 dark:bg-slate-900/30">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Reports Explorer</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow shadow-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-600 dark:text-slate-400 shadow-sm cursor-pointer transition-shadow"
          >
            <option value="all">All Status</option>
            <option value="ready">Ready</option>
            <option value="generating">Generating</option>
            <option value="error">Failed</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 w-10">
                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500/50" />
              </th>
              <th className="px-6 py-4">Report Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Generated Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <div className="relative">
                      <div className="w-10 h-10 border-4 border-emerald-100 dark:border-emerald-900 rounded-full"></div>
                      <div className="w-10 h-10 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="font-medium animate-pulse">Loading reports...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">No reports found</p>
                    <p className="mt-1 text-sm">Generate an AI report to get started.</p>
                  </motion.div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {paginatedReports.map((report) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={report.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500/50" />
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                      {report.report_type === 'excel' ? (
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 border border-emerald-100 dark:border-emerald-500/20 shadow-sm"><FileSpreadsheet className="w-4 h-4" /></div>
                      ) : (
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"><FileText className="w-4 h-4" /></div>
                      )}
                      {report.title}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium capitalize">{report.category}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatBytes(report.output_size_bytes)}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => onAction('preview', report.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onAction('download', report.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => onAction('share', report.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Share">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onAction('duplicate', report.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => onAction('archive', report.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Archive">
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && reports.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={reports.length}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={() => {}}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      )}
    </div>
  )
}
