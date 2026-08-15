import React from "react"
import { FileSpreadsheet, FileJson, FileText, Database, Eye, Trash2, ShieldCheck, AlertTriangle, Sparkles, Loader2, Edit2 } from "lucide-react"
import { PaginationControls } from "@/components/molecules/PaginationControls"

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DatasetExplorerTable({ 
  datasets, 
  loading, 
  onAction, 
  statusFilter = "all", 
  currentUser 
}: { 
  datasets: any[], 
  loading: boolean, 
  onAction: (action: string, id: string) => void, 
  statusFilter?: string, 
  currentUser?: { id: string, role: string } | null 
}) {
  
  const getFileIcon = (type: string | null | undefined) => {
    const t = (type || '').toLowerCase()
    if (t.includes('csv') || t.includes('xlsx')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
    if (t.includes('json')) return <FileJson className="w-4 h-4 text-amber-500" />
    return <FileText className="w-4 h-4 text-indigo-500" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Ready
          </span>
        )
      case 'profiling':
      case 'uploading':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
            Processing
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Error
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20">
            {status}
          </span>
        )
    }
  }

  const getQualityBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return <span className="text-xs text-slate-400 font-mono">-</span>
    }

    let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    if (score < 70) color = "text-rose-500 bg-rose-500/10 border-rose-500/20"
    else if (score < 85) color = "text-amber-500 bg-amber-500/10 border-amber-500/20"

    return (
      <div className="flex items-center gap-2">
        <div className={`px-2 py-0.5 rounded-md border text-xs font-bold font-mono ${color}`}>
          {score}%
        </div>
      </div>
    )
  }

  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 6

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
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-white/[0.02]">
              <th className="px-6 py-4">Dataset Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Dimensions</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Quality Score</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Uploaded</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    <p className="text-xs font-medium">Fetching dataset records...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedDatasets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl mb-4">
                      <Database className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No Datasets Found</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-sm">Upload your first dataset or adjust search filters to explore your catalog.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDatasets.map(dataset => (
                <tr key={dataset.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-100/80 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10 shrink-0">
                        {getFileIcon(dataset.file_type)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {dataset.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {dataset.description || dataset.file_type?.toUpperCase() || 'Dataset'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(dataset.status)}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {dataset.row_count != null ? `${dataset.row_count.toLocaleString()} rows` : '-'} 
                    <span className="text-slate-400 mx-1">×</span>
                    {dataset.column_count != null ? `${dataset.column_count.toLocaleString()} cols` : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{formatBytes(dataset.file_size_bytes)}</td>
                  <td className="px-6 py-4">
                    {getQualityBadge(dataset.data_quality_score)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                        {dataset.owner?.name?.charAt(0) || "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{dataset.owner?.name || "System"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{new Date(dataset.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {currentUser && currentUser.role !== 'viewer' && (
                        <>
                          <button 
                            onClick={() => onAction('analyze', dataset.id)} 
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" 
                            title="Analyze Dataset"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onAction('ai-excel', dataset.id)} 
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" 
                            title="Generate AI Excel"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onAction('dashboard', dataset.id)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors" 
                            title="Create Dashboard"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
                        </>
                      )}
                      
                      <button 
                        onClick={() => onAction('preview', dataset.id)} 
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {currentUser && currentUser.role !== 'viewer' && (
                        (currentUser.role === 'org_admin' || currentUser.role === 'manager' || dataset.uploaded_by_id === currentUser.id || dataset.owner?.id === currentUser.id) && (
                          <button 
                            onClick={() => onAction('edit', dataset.id)} 
                            className="p-1.5 text-slate-400 hover:text-teal-500 hover:bg-teal-500/10 rounded-lg transition-colors" 
                            title="Edit Metadata"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                      
                      {currentUser && (
                        (currentUser.role === 'org_admin' || dataset.uploaded_by_id === currentUser.id || dataset.owner?.id === currentUser.id) && (
                          <button 
                            onClick={() => onAction('delete', dataset.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" 
                            title="Delete Dataset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && datasets.length > 0 && (
        <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDatasets.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {}}
            pageSizeOptions={[6, 12, 24]}
          />
        </div>
      )}
    </div>
  )
}
