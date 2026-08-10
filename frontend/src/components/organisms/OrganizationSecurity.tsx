import Link from "next/link"
import { Shield, AlertTriangle, Globe, CheckCircle, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Security {
  active_sessions: { id: string; device: string; browser: string; ip: string; last_active: string }[]
  failed_logins: { id: string; ip: string; created_at: string }[]
}

export function OrganizationSecurity({ security }: { security: Security | null }) {
  if (!security) return null
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Sessions</h3>
            <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 text-[10px] font-semibold">
              {security.active_sessions?.length ?? 0}
            </Badge>
          </div>
          <Link href="/organization-admin/dashboard/profile">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer">
              Manage <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {(security.active_sessions || []).slice(0, 4).map(s => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex-shrink-0">
                <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {s.browser} &bull; <span className="font-mono text-slate-500 dark:text-slate-400">{s.ip}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {s.device} &bull; Active {formatDistanceToNow(new Date(s.last_active), { addSuffix: true })}
                </p>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
            </div>
          ))}
          {(!security.active_sessions || security.active_sessions.length === 0) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No active sessions.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Failed Login Attempts</h3>
            {(security.failed_logins?.length ?? 0) > 0 && (
              <Badge className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 text-[10px] font-semibold">
                {security.failed_logins.length}
              </Badge>
            )}
          </div>
          <Link href="/organization-admin/dashboard/profile">
            <span className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium cursor-pointer">
              History <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {(security.failed_logins || []).slice(0, 4).map(f => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="p-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">{f.ip}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 text-[10px] font-semibold">Failed</Badge>
            </div>
          ))}
          {(!security.failed_logins || security.failed_logins.length === 0) && (
            <div className="py-8 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No failed attempts. All clear!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
