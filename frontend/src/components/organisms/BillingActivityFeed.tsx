"use client"

import { History } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"

const typeColor: Record<string, string> = {
  subscription_updated: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  subscription_canceled: "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
  payment_received: "bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400",
}

export function BillingActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-billing-activity'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/activity')
      return res.data?.data ?? []
    }
  })

  if (isLoading) {
    return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
  }

  const activities: any[] = Array.isArray(data) ? data : []

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <History className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No billing activity yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-white/5">
      {activities.map((act: any) => (
        <div key={act.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
          <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${typeColor[act.type] || "bg-slate-100 text-slate-600"}`}>
            {act.type?.replace(/_/g, " ")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{act.tenant}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{act.description}</p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
            {act.date ? new Date(act.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
          </span>
        </div>
      ))}
    </div>
  )
}
