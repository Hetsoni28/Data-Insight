"use client"

import { FileText, Sparkles, Database, TrendingUp, Calendar, Upload, FileSpreadsheet } from "lucide-react"

interface ReportQuickActionsProps {
  onAction: (action: string) => void
}

export function ReportQuickActions({ onAction }: ReportQuickActionsProps) {
  const actions = [
    {
      id: "executive",
      title: "Executive Summary",
      desc: "High-level overview",
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    {
      id: "ai-insight",
      title: "AI Analysis",
      desc: "Deep data profiling",
      icon: <Sparkles className="w-5 h-5 text-teal-600" />,
      bg: "bg-teal-50"
    },
    {
      id: "dashboard",
      title: "BI Dashboard",
      desc: "Visual charts & graphs",
      icon: <Database className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    {
      id: "forecast",
      title: "Trend Forecast",
      desc: "Predictive modeling",
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    {
      id: "schedule",
      title: "Schedule Report",
      desc: "Automate delivery",
      icon: <Calendar className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50"
    },
    {
      id: "excel",
      title: "AI Excel",
      desc: "Full AI Workbook",
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50"
    },
    {
      id: "upload",
      title: "Import Template",
      desc: "Custom report layout",
      icon: <Upload className="w-5 h-5 text-slate-600" />,
      bg: "bg-slate-100"
    }
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all group bg-slate-50 dark:bg-slate-800/50"
          >
            <div className={`p-3 rounded-xl mb-3 transition-transform group-hover:scale-110 ${action.bg} dark:bg-opacity-10`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white mb-1">{action.title}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center">{action.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
