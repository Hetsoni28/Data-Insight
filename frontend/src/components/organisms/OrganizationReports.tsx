import { Button } from "@/components/ui/button"
import { MoreHorizontal, FileText, Share2 } from "lucide-react"
import { format } from "date-fns"

export function OrganizationReports({ reports }: { reports: any[] }) {
  if (!reports || reports.length === 0) return null

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generated analysis and dashboards.</p>
        </div>
        <Button variant="outline" className="rounded-full">View All</Button>
      </div>

      <div className="space-y-4">
        {reports.map((r, i) => (
          <div key={r.id || i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-black/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{r.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="capitalize">{r.type || 'Standard'} Report</span>
                  <span>•</span>
                  <span>{r.created_at ? format(new Date(r.created_at), 'MMM d, h:mm a') : ''}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
