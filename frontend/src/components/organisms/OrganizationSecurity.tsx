import { ShieldAlert, Monitor, AlertTriangle } from "lucide-react"
import { format } from "date-fns"

export function OrganizationSecurity({ security }: { security: any }) {
  if (!security) return null

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active sessions and access alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <Monitor className="h-4 w-4 mr-2 text-emerald-500" /> Active Sessions
          </h3>
          <div className="space-y-3">
            {security.active_sessions?.map((s: any, i: number) => (
              <div key={s.id || i} className="flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-200">{s.device || 'Unknown Device'}</div>
                  <div className="text-slate-500 text-xs">{s.browser || 'Unknown Browser'} • {s.ip}</div>
                </div>
                <div className="text-xs text-slate-500">{s.last_active ? format(new Date(s.last_active), 'MMM d, h:mm a') : 'Now'}</div>
              </div>
            ))}
            {(!security.active_sessions || security.active_sessions.length === 0) && (
              <div className="text-sm text-slate-500">No active sessions found.</div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2 text-rose-500" /> Recent Alerts
          </h3>
          <div className="space-y-3">
            {security.failed_logins?.map((f: any, i: number) => (
              <div key={f.id || i} className="flex justify-between items-start text-sm p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-rose-900 dark:text-rose-300">Failed Login Attempt</div>
                    <div className="text-rose-600/80 dark:text-rose-400/80 text-xs mt-0.5">IP: {f.ip}</div>
                  </div>
                </div>
                <div className="text-xs text-rose-500/70">{f.created_at ? format(new Date(f.created_at), 'MMM d, h:mm a') : ''}</div>
              </div>
            ))}
            {(!security.failed_logins || security.failed_logins.length === 0) && (
              <div className="text-sm text-slate-500">No recent security alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
