"use client"

import { Card } from "@/components/ui/card"
import { DollarSign, Users, Activity, TrendingUp, CreditCard, ActivityIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface KpiProps {
  data: any
  isLoading: boolean
}

function Sparkline({ data, color }: { data: number[], color: string }) {
  if (!data || data.length === 0) return null
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((val - min) / range) * 100
    return `${x},${y}`
  }).join(" ")

  return (
    <svg className="w-24 h-12 overflow-visible" viewBox="0 -10 100 120" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function SubscriptionRevenueKpi({ data, isLoading }: KpiProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  const kpis = [
    {
      title: "Monthly Recurring Revenue",
      value: `$${(data?.mrr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
      sparkline: data?.sparkline_revenue || [],
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      sparklineColor: "#10b981"
    },
    {
      title: "Annual Run Rate",
      value: `$${(data?.arr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: "+15.2%",
      trendUp: true,
      sparkline: (data?.sparkline_revenue || []).map((v: number) => v * 12),
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      sparklineColor: "#3b82f6"
    },
    {
      title: "Active Subscriptions",
      value: (data?.active_subscriptions || 0).toLocaleString(),
      icon: Users,
      trend: "+2 this month",
      trendUp: true,
      sparkline: [10, 12, 12, 14, 15, 18, 20],
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      sparklineColor: "#6366f1"
    },
    {
      title: "Total Revenue Collected",
      value: `$${(data?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CreditCard,
      trend: `${data?.failed_payments || 0} failed payments`,
      trendUp: (data?.failed_payments || 0) === 0,
      sparkline: [5000, 5200, 5800, 5600, 6000, 6800, 7200],
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      sparklineColor: "#f59e0b"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <Card key={i} className="p-6 overflow-hidden relative group hover:shadow-md transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{kpi.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
          </div>
          
          <div className="flex items-end justify-between mt-6">
            <div className={`text-sm font-medium flex items-center gap-1 ${kpi.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <ActivityIcon className="w-3 h-3" />
              {kpi.trend}
            </div>
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
              <Sparkline data={kpi.sparkline} color={kpi.sparklineColor} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
