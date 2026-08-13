"use client"
import Link from "next/link"
import { motion } from "framer-motion"
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
      {/* Active Sessions */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Active Sessions</h3>
            <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
              {security.active_sessions?.length ?? 0}
            </Badge>
          </div>
          <Link href="/organization-admin/dashboard/profile">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer transition-colors">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {(security.active_sessions || []).slice(0, 4).map(s => (
            <motion.div 
              key={s.id} 
              whileHover={{ x: 2 }}
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group"
            >
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex-shrink-0 border border-emerald-100 dark:border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {s.browser} &bull; <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px] font-semibold">{s.ip}</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {s.device} &bull; Active {formatDistanceToNow(new Date(s.last_active), { addSuffix: true })}
                </p>
              </div>
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </motion.div>
          ))}
          {(!security.active_sessions || security.active_sessions.length === 0) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-8 font-medium">No active sessions.</p>
          )}
        </div>
      </motion.div>

      {/* Failed Logins */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Failed Login Attempts</h3>
            {(security.failed_logins?.length ?? 0) > 0 && (
              <Badge className="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 text-[10px] font-bold px-2 py-0.5">
                {security.failed_logins.length}
              </Badge>
            )}
          </div>
          <Link href="/organization-admin/dashboard/profile">
            <span className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-bold cursor-pointer transition-colors">
              History <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {(security.failed_logins || []).slice(0, 4).map(f => (
            <motion.div 
              key={f.id} 
              whileHover={{ x: 2 }}
              className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group"
            >
              <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex-shrink-0 border border-rose-100 dark:border-rose-500/20 group-hover:scale-105 transition-transform duration-300">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{f.ip}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 text-[10px] font-bold">Failed</Badge>
            </motion.div>
          ))}
          {(!security.failed_logins || security.failed_logins.length === 0) && (
            <div className="py-8 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No failed attempts. All clear!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
