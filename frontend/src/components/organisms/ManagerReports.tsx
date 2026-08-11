import { FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export function ManagerReports({ reports }: { reports: any[] }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports available</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">No reports have been generated yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          Recent Reports
        </h2>
        <Link href="/manager/dashboard/reports" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <div className="flex flex-col truncate pr-4">
              <span className="font-medium text-slate-900 dark:text-white truncate">{report.title}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {report.type} • Created {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                report.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                report.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              }`}>
                {report.status}
              </span>
              <Link 
                href={`/manager/dashboard/reports/${report.id}`}
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
