"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, 
  Activity, PieChart, ShieldAlert, CreditCard, Zap
} from "lucide-react"

export function RevenueKpiGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['owner-revenue-kpis'],
    queryFn: async () => {
      const res = await api.get('/owner/billing/kpis')
      return res.data
    }
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-none" />
        ))}
      </div>
    )
  }

  // Helper: format a signed percentage. Returns "—" when the API has no comparison data yet.
  const fmtPct = (val: number | null | undefined, decimals = 1): string => {
    if (val === null || val === undefined) return "—"
    const sign = val >= 0 ? "+" : ""
    return `${sign}${val.toFixed(decimals)}%`
  }

  const fmtCount = (val: number | null | undefined, label: string): string => {
    if (val === null || val === undefined) return "—"
    return `${val >= 0 ? "+" : ""}${val} ${label}`
  }

  const kpis = [
    {
      label: "Total MRR",
      value: `$${data?.mrr?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: DollarSign,
      trend: fmtPct(data?.mrr_growth_pct),
      isPositive: (data?.mrr_growth_pct ?? 0) >= 0
    },
    {
      label: "Annual Run Rate (ARR)",
      value: `$${data?.arr?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: Target,
      trend: fmtPct(data?.arr_growth_pct),
      isPositive: (data?.arr_growth_pct ?? 0) >= 0
    },
    {
      label: "Active Subscriptions",
      value: data?.active_subscriptions,
      icon: Users,
      trend: fmtCount(data?.new_subscriptions_this_month, "this month"),
      isPositive: (data?.new_subscriptions_this_month ?? 0) >= 0
    },
    {
      label: "Average Revenue Per User (ARPU)",
      value: `$${data?.arpu?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: PieChart,
      trend: fmtPct(data?.arpu_growth_pct),
      isPositive: (data?.arpu_growth_pct ?? 0) >= 0
    },
    {
      label: "Est. Net Profit",
      value: `$${data?.net_profit?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: Activity,
      trend: fmtPct(data?.net_profit_growth_pct),
      isPositive: (data?.net_profit_growth_pct ?? 0) >= 0
    },
    {
      label: "AI Usage Revenue",
      value: `$${data?.ai_revenue?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: Zap,
      trend: fmtPct(data?.ai_revenue_growth_pct),
      isPositive: (data?.ai_revenue_growth_pct ?? 0) >= 0
    },
    {
      label: "Churn Rate",
      value: `${data?.churn_rate}%`,
      icon: ShieldAlert,
      // Lower churn is better — negative delta is a good sign
      trend: fmtPct(data?.churn_rate_delta_pct),
      isPositive: (data?.churn_rate_delta_pct ?? 0) <= 0
    },
    {
      label: "Failed Payments",
      value: `$${data?.failed_payments?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      icon: CreditCard,
      trend: data?.failed_payments_count
        ? `${data.failed_payments_count} require${data.failed_payments_count === 1 ? "s" : ""} action`
        : (data?.failed_payments ?? 0) > 0 ? "Requires action" : "All clear",
      isPositive: (data?.failed_payments ?? 0) === 0
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div 
            key={index} 
            className="group p-5 rounded-none border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-600 dark:text-slate-400 group-hover:scale-110 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
                <Icon className="w-5 h-5" />
              </div>
              <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                kpi.isPositive 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
              }`}>
                {kpi.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend}
              </div>
            </div>
            
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {kpi.value}
              </div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {kpi.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
