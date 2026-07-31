"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, ArrowRight } from "lucide-react"

export function TopOrganizationsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-organizations-top'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/organizations?skip=0&limit=5')
      return res.data
    }
  })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm flex flex-col h-[500px]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Paying Organizations</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 sticky top-0">
            <tr>
              <th className="px-6 py-4 font-medium">Organization</th>
              <th className="px-6 py-4 font-medium">Plan</th>
              <th className="px-6 py-4 font-medium text-right">MRR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                  <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No active subscriptions.</td>
              </tr>
            ) : (
              data?.data?.sort((a: any, b: any) => b.mrr - a.mrr).slice(0, 5).map((org: any) => (
                <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{org.name}</div>
                        <div className="text-xs text-slate-500">Since {new Date(org.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      ${org.plan.toLowerCase() === 'enterprise' ? 'border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-900 dark:text-purple-400 dark:bg-purple-900/20' : ''}
                    `}>
                      {org.plan.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right">
                    ${org.mrr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
