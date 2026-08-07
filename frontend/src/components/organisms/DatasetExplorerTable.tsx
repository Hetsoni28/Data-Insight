import React from "react"
import { FileSpreadsheet, FileJson, FileText, MoreHorizontal, Database, Eye, Trash2, ShieldCheck, AlertTriangle } from "lucide-react"
import { PaginationControls } from "@/components/molecules/PaginationControls"

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DatasetExplorerTable({ datasets, loading, onAction, statusFilter = "all" }: { datasets: any[], loading: boolean, onAction: (action: string, id: string) => void, statusFilter?: string }) {
  
  const getFileIcon = (type: string) => {
    if (type.includes('csv') || type.includes('xlsx')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
    if (type.includes('json')) return <FileJson className="w-4 h-4 text-amber-500" />
    return <FileText className="w-4 h-4 text-slate-500" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Ready</span>
      case 'profiling':
      case 'uploading':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">Processing</span>
      case 'error':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">Error</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20">{status}</span>
    }
  }

  const getQualityIcon = (score: number) => {
    if (score >= 90) return <ShieldCheck className="w-4 h-4 text-emerald-500" />
    if (score >= 70) return <ShieldCheck className="w-4 h-4 text-amber-500" />
    return <AlertTriangle className="w-4 h-4 text-rose-500" />
  }

  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 5

  const filteredDatasets = React.useMemo(() => {
    if (!datasets) return [];
    if (statusFilter === "all") return datasets;
    return datasets.filter(d => {
      if (statusFilter === "processing") return ['profiling', 'uploading', 'processing'].includes(d.status.toLowerCase());
      return d.status.toLowerCase() === statusFilter.toLowerCase();
    });
  }, [datasets, statusFilter]);

  const totalPages = Math.ceil(filteredDatasets.length / itemsPerPage)
  const paginatedDatasets = filteredDatasets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50">
              <th className="px-6 py-4">Dataset Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Rows / Cols</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Quality Score</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-500">Loading datasets...</td></tr>
            ) : paginatedDatasets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <Database className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Datasets Found</h3>
                    <p className="text-slate-500 mb-4 max-w-sm">Upload your first dataset or connect cloud storage to start building your AI data foundation.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDatasets.map(dataset => (
                <tr key={dataset.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {getFileIcon(dataset.file_type)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{dataset.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{dataset.description || dataset.file_type.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(dataset.status)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {dataset.row_count != null ? dataset.row_count.toLocaleString() : '-'} / {dataset.column_count != null ? dataset.column_count.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatBytes(dataset.file_size_bytes)}</td>
                  <td className="px-6 py-4">
                    {dataset.data_quality_score != null ? (
                      <div className="flex items-center gap-2">
                        {getQualityIcon(dataset.data_quality_score)}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{dataset.data_quality_score}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900 dark:text-white">{dataset.owner?.name || "System"}</p>
                      <p className="text-xs text-slate-500">{dataset.owner?.email || "N/A"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{new Date(dataset.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onAction('analyze', dataset.id)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded" title="Analyze Dataset">
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('ai-excel', dataset.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded" title="Generate AI Excel">
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('dashboard', dataset.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded" title="Create Dashboard">
                        <Database className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-white/10 my-auto mx-1"></div>
                      <button onClick={() => onAction('preview', dataset.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded" title="View Schema & Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAction('delete', dataset.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded" title="Delete Dataset">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && datasets.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={datasets.length}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={() => {}}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      )}
    </div>
  )
}
