"use client"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface DashboardStatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub: string
  color: string
  delay?: number
}

export function DashboardStatCard({ icon: Icon, label, value, sub, color, delay = 0 }: DashboardStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (typeof value === "number" || !isNaN(Number(value))) {
      const end = Number(value)
      let start = 0
      if (start === end) {
        setDisplayValue(end)
        return
      }
      
      const totalDuration = 800
      const incrementTime = Math.max(10, totalDuration / end)
      
      const timer = setInterval(() => {
        start += 1
        setDisplayValue(start)
        if (start >= end) {
          setDisplayValue(end)
          clearInterval(timer)
        }
      }, incrementTime)
      return () => clearInterval(timer)
    } else {
      // @ts-expect-error - value may be string or number, displayValue state accepts both
      setDisplayValue(value)
    }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {typeof value === 'number' || !isNaN(Number(value)) ? displayValue : value}
        </p>
        <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400 mt-1">{label}</p>
        <p className="text-[12px] text-slate-400 mt-1.5">{sub}</p>
      </div>
    </motion.div>
  )
}
