"use client"

import { FileText, TrendingUp, Sparkles, Clock, CheckCircle2, Calendar } from "lucide-react"

interface ReportStats {
  total_reports: number
  ai_reports: number
  scheduled_reports: number
  success_rate: number
  avg_generation_time_sec: number
}

interface ReportExecutiveKPIsProps {
  stats: ReportStats | null
}

export function ReportExecutiveKPIs({ stats }: ReportExecutiveKPIsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 h-28"></div>
        ))}
      </div>
    )
  }

  const kpis = [
    {
      title: "Total Reports",
      value: stats.total_reports,
      change: "+12% this month",
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: "AI Generated Reports",
      value: stats.ai_reports,
      change: "+24% this week",
      icon: <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      title: "Scheduled Reports",
      value: stats.scheduled_reports,
      change: "Active automations",
      icon: <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      title: "Generation Success Rate",
      value: `${stats.success_rate}%`,
      change: `Avg time: ${stats.avg_generation_time_sec}s`,
      icon: <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50 dark:bg-amber-500/10",
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              {kpi.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            {kpi.change}
          </div>
        </div>
      ))}
    </div>
  )
}
