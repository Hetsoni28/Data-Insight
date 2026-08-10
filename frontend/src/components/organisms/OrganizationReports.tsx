import Link from "next/link"
import { FileText, Plus, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/molecules/StatusBadge"
import { formatDistanceToNow } from "date-fns"

interface Report { id: string; title: string; type: string; status: string; created_at: string }

export function OrganizationReports({ reports }: { reports: Report[] }) {
  const items = reports || []
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Reports</h3>
          <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 text-[10px] font-semibold">{items.length}</Badge>
        </div>
        <Link href="/organization-admin/dashboard/reports">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/20 px-3 py-1.5 rounded-lg transition-all">
            <Plus className="h-3 w-3" />New
          </button>
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {items.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No reports yet.</p>
          </div>
        )}
        {items.map(r => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex-shrink-0">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{r.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {r.type?.replace(/_/g, " ")} &bull; {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <Link href="/organization-admin/dashboard/reports">
          <button className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-1">
            View all reports <ArrowRight className="h-3 w-3" />
          </button>
        </Link>
      </div>
    </div>
  )
}
