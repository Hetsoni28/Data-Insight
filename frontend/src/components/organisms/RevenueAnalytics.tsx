"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts"
import { DollarSign, TrendingUp, Users, Activity } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl rounded-md p-3 text-sm">
        <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400 capitalize">{entry.name}:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{prefix}{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueAnalytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetchRevenue()
  }, [])

  const fetchRevenue = async () => {
    try {
      const res = await api.get("/admin/revenue")
      setData(res.data)
    } catch (error) {
      console.error("Failed to fetch revenue", error)
      toast.error("Failed to load revenue data.")
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return <div className="w-full h-[300px] rounded-xl bg-slate-100 dark:bg-white/10 animate-pulse" />

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 h-32 animate-pulse" />
        ))}
        <div className="lg:col-span-3 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 h-[400px] animate-pulse" />
        <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 h-[400px] animate-pulse" />
      </div>
    )
  }

  if (!data) return null

  const COLORS = {
    Enterprise: '#10b981', // Emerald
    Professional: '#3b82f6', // Blue
    Starter: '#f59e0b', // Amber
  }

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">+12%</span>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Recurring Revenue</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${data.mrr.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">+15%</span>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Annual Run Rate (ARR)</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${data.arr.toLocaleString()}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">+8</span>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Subscriptions</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{data.active_subscriptions}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">+0.2%</span>
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue Churn Rate</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{data.churn_rate}%</p>
        </motion.div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MRR Growth Over Time */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">MRR Growth</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monthly Recurring Revenue over the last 6 months.</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500 dark:text-slate-400" tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip content={<CustomTooltip prefix="$" />} />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10b981" strokeWidth={3} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Plan Distribution</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Active subscriptions by tier.</p>
          <div className="h-[220px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.plan_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="plan"
                  stroke="none"
                >
                  {data.plan_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.plan] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0B0F17', 
                    borderColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '10px', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.active_subscriptions}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
            {data.plan_distribution.map((plan: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: (COLORS as any)[plan.plan] }} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{plan.plan}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{plan.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
