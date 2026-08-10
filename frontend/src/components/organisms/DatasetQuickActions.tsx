import { Upload, Sparkles, LayoutDashboard, FileSpreadsheet, Plus } from "lucide-react"

export function DatasetQuickActions({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button 
        onClick={() => onAction('upload')}
        className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all text-left"
      >
        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white text-sm">Upload Dataset</h4>
          <p className="text-xs text-slate-500">CSV, Excel, JSON</p>
        </div>
      </button>

      <button 
        onClick={() => onAction('ai-excel')}
        className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all text-left"
      >
        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white text-sm">Generate AI Excel</h4>
          <p className="text-xs text-slate-500">Auto-analyze & format</p>
        </div>
      </button>

      <button 
        onClick={() => onAction('dashboard')}
        className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all text-left"
      >
        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white text-sm">Create Dashboard</h4>
          <p className="text-xs text-slate-500">Visualize data instantly</p>
        </div>
      </button>

      <button 
        onClick={() => onAction('analyze')}
        className="flex items-center gap-3 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-amber-500 hover:shadow-sm transition-all text-left"
      >
        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white text-sm">Analyze Dataset</h4>
          <p className="text-xs text-slate-500">Run data quality check</p>
        </div>
      </button>
    </div>
  )
}
