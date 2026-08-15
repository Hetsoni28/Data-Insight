"use client"

import { FileText } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"

export function OwnerInvoicesTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-invoices'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/invoices?skip=0&limit=20')
      return res.data?.data ?? []
    }
  })

  if (isLoading) {
    return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
  }

  const invoices: any[] = Array.isArray(data) ? data : []

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FileText className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No invoices found</p>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold">Organization</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{inv.tenant_name}</td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                  {inv.currency || "$"}{Number(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <Badge className={`text-[10px] font-bold uppercase ${statusColor[inv.status] || "bg-slate-100 text-slate-600"}`}>
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                  {inv.date ? new Date(inv.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
