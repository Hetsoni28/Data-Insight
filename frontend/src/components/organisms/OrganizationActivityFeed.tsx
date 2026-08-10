"use client"
import Link from "next/link"
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
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Activity Feed</h3>
        </div>
        <Link href="/organization-admin/dashboard/team">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer">
            View all <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
        {(!activity || activity.length === 0) && (
          <p className="text-xs text-slate-500 text-center py-8">No recent activity.</p>
        )}
        {(activity || []).slice(0, 12).map(a => {
          const Icon = resolveIcon(a.action)
          const ok = a.status === "success"
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg ${ok ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10"}`}>
                <Icon className={`h-3.5 w-3.5 ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-900 dark:text-slate-200 font-semibold truncate">{a.action}</p>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {a.resource_type && <span className="capitalize mr-1">{a.resource_type} &bull;</span>}
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
