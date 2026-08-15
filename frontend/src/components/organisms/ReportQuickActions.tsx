"use client"

import { FileText, Sparkles, Database, TrendingUp, Calendar, Upload, FileSpreadsheet } from "lucide-react"
import { motion } from "framer-motion"

interface ReportQuickActionsProps {
  onAction: (action: string) => void
}

export function ReportQuickActions({ onAction }: ReportQuickActionsProps) {
  const actions = [
    {
      id: "executive",
      title: "Executive Summary",
      desc: "High-level overview",
      icon: <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-emerald-500/10"
    },
    {
      id: "ai-insight",
      title: "AI Analysis",
      desc: "Deep data profiling",
      icon: <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors" />,
      bg: "bg-teal-50 dark:bg-teal-500/10",
      border: "hover:border-teal-500/50 dark:hover:border-teal-500/50 hover:shadow-teal-500/10"
    },
    {
      id: "dashboard",
      title: "BI Dashboard",
      desc: "Visual charts & graphs",
      icon: <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors" />,
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      border: "hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-indigo-500/10"
    },
    {
      id: "forecast",
      title: "Trend Forecast",
      desc: "Predictive modeling",
      icon: <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />,
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-blue-500/10"
    },
    {
      id: "schedule",
      title: "Schedule Report",
      desc: "Automate delivery",
      icon: <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors" />,
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-amber-500/10"
    },
    {
      id: "excel",
      title: "AI Excel",
      desc: "Full AI Workbook",
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-emerald-500/10"
    },
    {
      id: "upload",
      title: "Import Template",
      desc: "Custom report layout",
      icon: <Upload className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors" />,
      bg: "bg-slate-100 dark:bg-slate-800",
      border: "hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-slate-500/10"
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 20 } }
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
      
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 tracking-tight relative z-10">Quick Actions</h3>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 relative z-10"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            variants={item}
            whileHover={{ y: -4, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(action.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/60 dark:border-white/5 transition-all group bg-white/50 dark:bg-white/[0.02] shadow-sm hover:shadow-lg ${action.border}`}
          >
            <div className={`p-3 rounded-xl mb-3 transition-transform duration-300 ease-out group-hover:scale-110 ${action.bg}`}>
              {action.icon}
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{action.title}</span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">{action.desc}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
