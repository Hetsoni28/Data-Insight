import { Database, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export function ManagerDatasets({ datasets }: { datasets: any[] }) {
  if (!datasets || datasets.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm text-center py-12">
        <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No datasets available</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">No datasets are available in your authorized workspace.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-500" />
          Recent Datasets
        </h2>
        <Link href="/manager/dashboard/datasets" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-white">{dataset.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {dataset.rows.toLocaleString()} rows • Uploaded {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                dataset.status === 'ready' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                dataset.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              }`}>
                {dataset.status}
              </span>
              <Link 
                href={`/manager/dashboard/datasets/${dataset.id}`}
                className="text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
