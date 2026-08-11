import { Database, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export function ManagerDatasetsHeader({ summary }: { summary: any }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Datasets</h1>
          <p className="text-slate-500 dark:text-slate-400">Explore, manage, analyze, and monitor your authorized business data.</p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Datasets</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total || 0}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.active || 0}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Processing</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.processing || 0}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Failed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.failed || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
