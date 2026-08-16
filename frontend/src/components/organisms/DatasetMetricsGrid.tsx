"use client"

import { motion } from "framer-motion"
import { MetricCard } from "@/components/molecules/MetricCard"

export interface DatasetMetric {
  title: string
  value: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
  colorClass?: string
}

interface DatasetMetricsGridProps {
  metrics: DatasetMetric[]
}

export function DatasetMetricsGrid({ metrics }: DatasetMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 + (idx * 0.05) }}
          className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/10 dark:border-emerald-500/10 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col justify-center relative overflow-hidden group"
        >
          {metric.colorClass && (
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 transition-colors ${metric.colorClass}`} />
          )}
          <div className="relative z-10">
            {metric.trend !== undefined ? (
               <MetricCard
                 title={metric.title}
                 value={metric.value}
                 icon={metric.icon}
                 trend={metric.trend}
                 trendLabel={metric.trendLabel}
               />
            ) : (
               <>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-wider relative z-10">
                    {metric.icon} {metric.title}
                  </span>
                  <span className="text-3xl font-extrabold mt-3 text-slate-900 dark:text-white relative z-10">
                    {metric.value}
                  </span>
               </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
