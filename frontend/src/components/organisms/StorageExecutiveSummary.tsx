import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react"

interface StorageExecutiveSummaryProps {
  overview?: any
}

export function StorageExecutiveSummary({ overview }: StorageExecutiveSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-900/10 via-slate-900/5 to-emerald-900/10 dark:from-emerald-900/20 dark:via-slate-900/50 dark:to-emerald-900/20 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-32 h-32 text-emerald-500" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-white">AI Storage Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 relative z-10">
        
        {/* Insight 1 */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            <TrendingUp className="h-4 w-4" />
            Growth Optimized
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Storage growth has slowed by <span className="font-semibold text-emerald-600 dark:text-emerald-400">12%</span> this week due to automatic lifecycle archiving.
          </p>
        </div>

        {/* Insight 2 */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 hover:border-amber-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-500 font-medium text-sm">
            <AlertTriangle className="h-4 w-4" />
            Quota Alert
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">Acme Corp</span> is projected to hit their 50GB storage limit in 4 days. Consider sending an upgrade prompt.
          </p>
        </div>

        {/* Insight 3 */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            <Sparkles className="h-4 w-4" />
            Cost Savings
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Deleting 45GB of unused temp files (older than 30 days) could save <span className="font-semibold text-emerald-600 dark:text-emerald-400">$1.03/mo</span>.
          </p>
          <button className="mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Apply cleanup <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Insight 4 */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            <ShieldCheck className="h-4 w-4" />
            Backup Health
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            All 5 critical system backups completed successfully. Next snapshot scheduled in 6 hours.
          </p>
        </div>

      </div>
    </div>
  )
}
