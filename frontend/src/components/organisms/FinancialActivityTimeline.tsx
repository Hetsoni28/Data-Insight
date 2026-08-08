"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { History, ArrowUpCircle, ArrowDownCircle, CheckCircle2, XCircle, CreditCard } from "lucide-react"

export function FinancialActivityTimeline() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-billing-activity'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/activity')
      return res.data
    }
  })

  const getIconForType = (type: string) => {
    switch(type) {
      case 'subscription_updated': return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
      case 'subscription_canceled': return <XCircle className="w-4 h-4 text-rose-500" />
      case 'payment_succeeded': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'payment_failed': return <ArrowDownCircle className="w-4 h-4 text-rose-500" />
      default: return <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm flex flex-col h-[500px]">
      <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center gap-2 shrink-0">
        <History className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="space-y-6">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No recent financial activity.</div>
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-white/10 ml-4 space-y-8">
            {data?.data?.map((act: any) => (
              <div key={act.id} className="relative pl-6">
                <div className="absolute w-8 h-8 bg-white dark:bg-[#0B0F17] border border-slate-200/60 dark:border-white/10 rounded-full flex items-center justify-center -left-[17px] -top-1">
                  {getIconForType(act.type)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {act.tenant}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {act.description}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
                    {new Date(act.date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
