"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { Activity, DollarSign, Users, Database } from "lucide-react"

interface AnalyticsGridProps {
  analyticsData?: any;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg">
        <p className="text-slate-900 dark:text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.fill || '#10B981' }}>
            {entry.name} : {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsGrid({ analyticsData }: AnalyticsGridProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock data falling back if not provided via API
  const revenueData = analyticsData?.revenue || [
    { date: "Jan", amount: 12000, target: 10000 },
    { date: "Feb", amount: 15000, target: 12000 },
    { date: "Mar", amount: 18000, target: 15000 },
    { date: "Apr", amount: 22000, target: 18000 },
    { date: "May", amount: 28000, target: 22000 },
    { date: "Jun", amount: 35000, target: 25000 },
  ]

  const orgGrowthData = analyticsData?.organizations || [
    { date: "Jan", active: 20, new: 5 },
    { date: "Feb", active: 25, new: 8 },
    { date: "Mar", active: 32, new: 10 },
    { date: "Apr", active: 40, new: 12 },
    { date: "May", active: 52, new: 15 },
    { date: "Jun", active: 65, new: 18 },
  ]

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Revenue Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Recurring Revenue</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              +25% YTD
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.1 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="amount" name="Actual Revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              <Area type="monotone" dataKey="target" name="Target" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Organization Growth */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Organization Growth</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active vs New Tenants</p>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={orgGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.1 }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="active" name="Active Orgs" stackId="a" fill="#059669" radius={[0, 0, 4, 4]} />
              <Bar dataKey="new" name="New Orgs" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

    </div>
  )
}
