"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Activity, Loader2 } from "lucide-react"
import api from "@/lib/api"

export function DashboardUsageChart() {
  const [data, setData] = useState<any[]>([])
  const [growth, setGrowth] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data: res } = await api.get("/admin/usage-trends")
        setData(res.trends)
        setGrowth(res.growth_percentage)
      } catch (error) {
        console.error("Failed to fetch usage trends", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 lg:col-span-2 relative overflow-hidden"
    >
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Processing Trends</h3>
          </div>
          <p className="text-sm text-slate-500">Data rows processed by AI over the last 30 days</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            +{growth}% vs last month
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full mt-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-slate-500 font-medium">No usage data for the last 30 days</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRows" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#64748B" }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#64748B" }} 
                width={40}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                itemStyle={{ color: '#10B981', fontWeight: 500 }}
              />
              <Area 
                type="monotone" 
                dataKey="rows" 
                name="Rows Processed"
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRows)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: "#059669" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
