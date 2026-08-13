"use client"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Shield, Database, FileText, Users, Cpu, ArrowRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { StatusBadge } from "@/components/molecules/StatusBadge"

interface ActivityItem { id: string; action: string; resource_type: string; status: string; created_at: string }

function resolveIcon(action: string) {
  if (action.includes("login")) return Shield
  if (action.includes("dataset") || action.includes("data")) return Database
  if (action.includes("report")) return FileText
  if (action.includes("user")) return Users
  if (action.includes("ai") || action.includes("inference")) return Cpu
  return Activity
}

export function OrganizationActivityFeed({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
            <Activity className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Live Activity Feed</h3>
        </div>
        <Link href="/organization-admin/dashboard/team">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[310px] pr-1.5 custom-scrollbar">
        {(!activity || activity.length === 0) && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Activity className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs font-semibold">No recent activity.</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {(activity || []).slice(0, 12).map((a, i) => {
            const Icon = resolveIcon(a.action)
            const ok = a.status === "success"
            return (
              <motion.div 
                key={a.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 group p-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className={`mt-0.5 flex-shrink-0 p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 ${ok ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-900 dark:text-slate-200 font-bold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{a.action}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {a.resource_type && <span className="capitalize mr-1 text-slate-600 dark:text-slate-300 font-semibold">{a.resource_type} &bull;</span>}
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
