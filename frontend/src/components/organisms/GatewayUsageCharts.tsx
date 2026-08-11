"use client"
import { motion } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts"
import { BarChart3, TrendingUp } from "lucide-react"
import { ChartTooltip } from "@/components/molecules/ChartTooltip"

interface GatewayUsageChartsProps {
  trends: any[];
  errors: Record<string, number>;
}

export function GatewayUsageCharts({ trends, errors }: GatewayUsageChartsProps) {
  
  // Format errors object into array for Recharts
  const errorData = Object.entries(errors || {}).map(([code, count]) => ({
    code: `HTTP ${code}`,
    count: count as number,
    fill: code.startsWith('5') ? '#EF4444' : '#F59E0B'
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 lg:col-span-2 shadow-sm relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">API Usage Traffic</h3>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  className="text-slate-500 dark:text-slate-400" 
                  dy={10} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }} 
                  className="text-slate-500 dark:text-slate-400" 
                  tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRequests)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">No traffic data available</div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Error Analytics</h3>
        </div>

        <div className="h-[300px] w-full">
          {errorData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                <XAxis type="number" hide />
                <YAxis dataKey="code" type="category" axisLine={false} tickLine={false} className="text-slate-500 dark:text-slate-400 font-medium text-xs" width={60} />
                <Tooltip cursor={{ fill: 'transparent' }} content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Zero Errors Detected</p>
              <p className="text-xs text-slate-500 mt-1">Your APIs are running perfectly.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
