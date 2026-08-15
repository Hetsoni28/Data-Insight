import { Database, ArrowRight, TableProperties } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export function RecentDatasetsWidget({ datasets, basePath = "/dashboard/datasets" }: { datasets: any[], basePath?: string }) {
  if (!datasets || datasets.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-none border border-slate-200/50 dark:border-white/5 shadow-sm text-center py-16">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-none flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">No datasets available</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">No datasets are currently available in your authorized workspace.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-none border border-slate-200/50 dark:border-white/5 shadow-sm relative overflow-hidden group">
      {/* Subtle Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-none">
            <Database className="w-5 h-5" />
          </div>
          Recent Datasets
        </h2>
        <Link href={basePath} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-4 relative z-10">
        {datasets.map((dataset) => (
          <Link 
            key={dataset.id} 
            href={basePath}
            className="group/item block"
          >
            <div className="flex items-center justify-between p-4 rounded-none bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-none bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover/item:text-emerald-500 group-hover/item:bg-emerald-50 dark:group-hover/item:bg-emerald-500/10 transition-colors">
                  <TableProperties className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
                    {dataset.name}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {dataset.rows.toLocaleString()} rows • Uploaded {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest ${
                  (dataset.status === 'ready' || dataset.status === 'READY' || dataset.status === 'completed') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                  (dataset.status === 'error' || dataset.status === 'ERROR') ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' :
                  'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20'
                }`}>
                  {dataset.status}
                </span>
                <div className="w-8 h-8 rounded-none bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:bg-emerald-100 group-hover/item:text-emerald-600 dark:group-hover/item:bg-emerald-500/20 dark:group-hover/item:text-emerald-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
