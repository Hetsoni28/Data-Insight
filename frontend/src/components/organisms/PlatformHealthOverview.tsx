"use client";

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Database, Server, HardDrive, Mail, Zap, Bot, Activity, Wifi, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface HealthItem {
  id: string;
  name: string;
  status: "operational" | "degraded" | "down";
  icon: React.ElementType;
  value: string;
}

export function PlatformHealthOverview({ initialData }: { initialData?: any }) {
  const [healthData, setHealthData] = useState<HealthItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = initialData ? { data: { data: initialData } } : await api.get("/owner/health")
        
        // Map icon components to the incoming data IDs
        const iconMap: Record<string, React.ElementType> = {
          "api": Server,
          "db": Database,
          "redis": Zap,
          "storage": HardDrive,
          "ai": Bot,
          "email": Mail,
          "jobs": Activity,
          "ws": Wifi
        }

        const dataWithIcons = res.data.data.map((item: any) => ({
          ...item,
          icon: iconMap[item.id] || Server
        }))

        setHealthData(dataWithIcons)
      } catch (error) {
        console.error("Failed to fetch platform health", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHealth()
    
    // Poll every 30 seconds for live feel
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">System Health</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live infrastructure status across all regions.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-sm font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          99.99% Uptime
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {healthData.map((item, index) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800/80"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                <item.icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
            </div>
            <div className="flex items-end justify-between mt-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.value}</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.status === 'operational' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : item.status === 'degraded' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'operational' ? 'text-emerald-600 dark:text-emerald-400' : item.status === 'degraded' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {item.status}
                </span>
              </div>
            </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
