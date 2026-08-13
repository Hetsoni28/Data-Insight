"use client"

import { LeadStatus, STATUS_CONFIG, PIPELINE_ORDER } from "./LeadDetailsDrawer"
import { motion } from "framer-motion"

interface LeadsKpiGridProps {
  stats: any
  statusFilter: LeadStatus | "all"
  setStatusFilter: (status: LeadStatus | "all") => void
}

export function LeadsKpiGrid({ stats, statusFilter, setStatusFilter }: LeadsKpiGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {PIPELINE_ORDER.map((status, i) => {
        const cfg = STATUS_CONFIG[status]
        const count = stats?.pipeline?.[status] ?? 0
        const isActive = statusFilter === status
        
        return (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={status}
            onClick={() => setStatusFilter(isActive ? "all" : status)}
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
              isActive
                ? `${cfg.bg} border-transparent shadow-sm ring-1 ring-black/5 dark:ring-white/10`
                : "bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
            }`}
          >
            {/* Background Accent on Hover/Active */}
            <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'group-hover:opacity-5'} bg-gradient-to-br from-transparent to-current ${cfg.color.split(' ')[0]} pointer-events-none`} />
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${isActive ? cfg.color : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`}>
                {cfg.label}
              </p>
              <p className={`text-2xl font-black ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                {count}
              </p>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
