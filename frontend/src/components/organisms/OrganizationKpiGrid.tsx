"use client"
import { Users, Database, FileText, HardDrive, Cpu, TrendingUp, TrendingDown } from "lucide-react"

export function OrganizationKpiGrid({ kpis }: { kpis: any }) {
  if (!kpis) return null

  const renderTrend = (growth: number) => {
    if (growth === undefined || growth === null) return null
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
        {Math.abs(growth)}%
      </div>
    )
  }

  const metrics = [
    {
      title: "Active Team Members",
      value: kpis.active_users,
      icon: Users,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      title: "Datasets Processed",
      value: kpis.datasets?.total,
      growth: kpis.datasets?.growth,
      icon: Database,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      title: "Reports Generated",
      value: kpis.reports?.total,
      growth: kpis.reports?.growth,
      icon: FileText,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      title: "Storage Used",
      value: `${kpis.storage_mb} MB`,
      icon: HardDrive,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-500/10"
    },
    {
      title: "AI Inference Requests",
      value: kpis.ai_requests?.total,
      growth: kpis.ai_requests?.growth,
      icon: Cpu,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-500/10"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {metrics.map((m, i) => (
        <div key={i} className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${m.bg}`}>
              <m.icon className={`h-6 w-6 ${m.color}`} />
            </div>
            {m.growth !== undefined && renderTrend(m.growth)}
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{m.title}</h3>
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {m.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
