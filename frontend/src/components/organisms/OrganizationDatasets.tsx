import { Button } from "@/components/ui/button"
import { MoreHorizontal, FileSpreadsheet, Eye, Trash2, Download } from "lucide-react"
import { format } from "date-fns"

export function OrganizationDatasets({ datasets }: { datasets: any[] }) {
  if (!datasets || datasets.length === 0) return null

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Datasets</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Newly uploaded tabular data.</p>
        </div>
        <Button variant="outline" className="rounded-full">View All</Button>
      </div>

      <div className="space-y-4">
        {datasets.map((d, i) => (
          <div key={d.id || i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-xl">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{d.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{d.rows?.toLocaleString()} rows</span>
                  <span>•</span>
                  <span>{d.columns} columns</span>
                  <span>•</span>
                  <span>{d.created_at ? format(new Date(d.created_at), 'MMM d') : ''}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                d.status === 'ready' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                d.status === 'processing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
              }`}>
                {d.status || 'Ready'}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
