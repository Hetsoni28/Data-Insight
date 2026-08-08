"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Download, Share2, MoreVertical, FileText, CheckCircle2, Clock, XCircle, FileSpreadsheet, Eye, Copy, Archive } from "lucide-react"
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
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Ready</span>
      case 'generating':
      case 'queued':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><Clock className="w-3 h-3 mr-1 animate-spin-slow" /> Generating</span>
      case 'error':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" /> Failed</span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400">{status}</span>
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reports Explorer</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none text-slate-600 dark:text-slate-400"
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
          <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium w-10">
                <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              </th>
              <th className="px-6 py-4 font-medium">Report Name</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Size</th>
              <th className="px-6 py-4 font-medium">Generated Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex justify-center mb-4"><Clock className="w-8 h-8 animate-spin" /></div>
                  <p>Loading reports...</p>
                </td>
              </tr>
            ) : paginatedReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex justify-center mb-4"><FileText className="w-12 h-12 text-slate-300 dark:text-slate-700" /></div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">No reports found</p>
                  <p className="mt-1">Generate an AI report to get started.</p>
                </td>
              </tr>
            ) : (
              paginatedReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    {report.report_type === 'excel' ? (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600"><FileSpreadsheet className="w-4 h-4" /></div>
                    ) : (
                      <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600"><FileText className="w-4 h-4" /></div>
                    )}
                    {report.title}
                  </td>
                  <td className="px-6 py-4 text-slate-500 capitalize">{report.category}</td>
                  <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                  <td className="px-6 py-4 text-slate-500">{formatBytes(report.output_size_bytes)}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(report.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onAction('preview', report.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('download', report.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('share', report.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('duplicate', report.id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('archive', report.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded" title="Archive">
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
