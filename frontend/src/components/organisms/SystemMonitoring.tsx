"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { Activity, Server, Cpu, Database, AlertCircle, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

const CustomTooltip = ({ active, payload, label, suffix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/10 shadow-xl rounded-xl p-3 text-sm">
        <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400 capitalize">{entry.name}:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{entry.value}{suffix}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function SystemMonitoring() {
  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // Initial fetch
    fetchMonitoring()

    // Poll every 2.5 seconds
    const interval = setInterval(fetchMonitoring, 2500)
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoring = async () => {
    try {
      const res = await api.get("/admin/monitoring")
      const data = res.data
      
      setCurrentMetrics(data)
      setHistory(prev => {
        // Keep the last 30 data points (75 seconds of history)
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
          cpu: data.cpu_percent,
          memory: data.memory_percent,
          latency: data.api_latency_ms
        }]
        return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory
      })
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch monitoring data", error)
    }
  }

  if (!mounted) return <div className="w-full h-[200px] rounded-xl bg-slate-100 dark:bg-white/10 animate-pulse" />

  if (loading || !currentMetrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 h-32 animate-pulse" />
        ))}
        <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 h-[300px] animate-pulse" />
        <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 h-[300px] animate-pulse" />
      </div>
    )
  }

  // Pre-fill history if it's too short for a nice graph
  const displayHistory = history.length < 30 
    ? [...Array(30 - history.length).fill({ time: '', cpu: 0, memory: 0, latency: 0 }), ...history]
    : history

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Server className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">System Uptime</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{currentMetrics.uptime}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Connections</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{currentMetrics.active_connections.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10">
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Error Rate (5xx)</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{currentMetrics.error_rate}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Alerts</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{currentMetrics.alerts.length}</p>
        </motion.div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CPU & Memory Gauge (Line Chart approximation) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-600" />
                Cluster Resource Utilization
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">CPU and Memory mapped in real-time.</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Line type="monotone" isAnimationActive={false} dataKey="cpu" name="CPU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" isAnimationActive={false} dataKey="memory" name="Memory" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* API Latency */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Global API Latency
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time p99 response time monitoring.</p>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val}ms`} />
                <Tooltip content={<CustomTooltip suffix="ms" />} />
                <Line type="monotone" isAnimationActive={false} dataKey="latency" name="Latency (p99)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Alerts Feed */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Recent System Alerts</h3>
          <div className="space-y-3">
            {currentMetrics.alerts.map((alert: any) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  {alert.level === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{alert.message}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{alert.id}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{alert.time}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
