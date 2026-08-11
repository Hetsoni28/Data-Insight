import { MoreVertical, ChevronLeft, ChevronRight, Eye, RefreshCw, Trash2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export function ManagerDatasetsTable({ 
  datasets, 
  loading, 
  page, 
  totalPages,
  onPageChange,
  onDelete
}: { 
  datasets: any[], 
  loading: boolean,
  page: number,
  totalPages: number,
  onPageChange: (p: number) => void,
  onDelete: (id: string) => void
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-12 text-center shadow-sm">
        <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No datasets found</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">No datasets match your current search or filter criteria.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium">
            <tr>
              <th className="px-6 py-4">Dataset Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Rows</th>
              <th className="px-6 py-4">Size (MB)</th>
              <th className="px-6 py-4">Quality Score</th>
              <th className="px-6 py-4">Last Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {datasets.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <Link href={`/manager/dashboard/datasets/${d.id}`} className="font-medium text-slate-900 dark:text-white hover:text-emerald-600 transition-colors">
                    {d.name}
                  </Link>
                  {d.description && <p className="text-xs text-slate-500 max-w-[200px] truncate mt-0.5">{d.description}</p>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    d.status === 'ready' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                    d.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                    {d.status === 'ready' ? 'Active' : d.status === 'profiling' ? 'Processing' : d.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  {d.rows?.toLocaleString() || '-'}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  {d.size_bytes ? (d.size_bytes / (1024 * 1024)).toFixed(2) : '-'}
                </td>
                <td className="px-6 py-4">
                  {d.quality_score ? (
                    <span className={`font-medium ${d.quality_score > 90 ? 'text-emerald-600 dark:text-emerald-400' : d.quality_score > 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {d.quality_score}%
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                  {formatDistanceToNow(new Date(d.updated_at), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/manager/dashboard/datasets/${d.id}`} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => onDelete(d.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Dataset">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Page {page} of {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
