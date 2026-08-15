"use client"

import { FileText, TrendingUp, Sparkles, Clock, CheckCircle2, Calendar } from "lucide-react"
import { motion } from "framer-motion"

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-2xl p-5 h-32 animate-pulse flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-full">
                <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4"></div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/50"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const kpis = [
    {
      title: "Total Reports",
      value: stats.total_reports,
      change: "+12% this month",
      icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      title: "AI Generated Reports",
      value: stats.ai_reports,
      change: "+24% this week",
      icon: <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: "bg-teal-50 dark:bg-teal-500/10",
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {kpis.map((kpi, i) => (
        <motion.div 
          key={i} 
          variants={item}
          whileHover={{ y: -4, scale: 1.02 }}
          className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm transition-all hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:border-emerald-500/30 group overflow-hidden"
        >
          {/* Subtle gradient glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-colors duration-500 rounded-2xl pointer-events-none" />
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">{kpi.value}</h3>
            </div>
            <div className={`p-2.5 rounded-xl ${kpi.bg} shadow-sm group-hover:scale-110 transition-transform duration-300 ease-out`}>
              {kpi.icon}
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 relative z-10">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            {kpi.change}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
