"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from "recharts"
import { Cpu, TrendingUp, Sparkles } from "lucide-react"

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const title = label || payload[0]?.payload?.name
    return (
      <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md border border-slate-200 dark:border-white/15 p-3 rounded-xl shadow-2xl min-w-[150px]">
        {title && <p className="font-bold text-slate-900 dark:text-white mb-2 text-sm">{title}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="text-xs font-semibold flex items-center justify-between gap-4 py-0.5">
            <span style={{ color: entry.color || entry.payload?.fill || '#10b981' }} className="capitalize font-medium">
              {entry.name}:
            </span>
            <span className="text-slate-900 dark:text-white font-mono">
              ${Number(entry.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueAnalyticsCharts() {
  const [activeTab, setActiveTab] = useState("trends")
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['owner-revenue-trends'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/revenue-trends')
      return res.data
    }
  })

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['owner-revenue-forecast'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/analytics/forecast')
      return res.data
    }
  })

  const { data: aiCosts, isLoading: aiCostsLoading } = useQuery({
    queryKey: ['owner-ai-costs'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/analytics/ai-costs')
      return res.data
    }
  })


  if (!mounted) return <div className="w-full h-[320px] rounded-xl bg-slate-100 dark:bg-white/10 animate-pulse" />

  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial Analytics</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Analyze revenue, forecasts, and API costs in real-time.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 bg-slate-100 dark:bg-white/10">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="costs">AI Costs</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[400px] w-full">
        {activeTab === "trends" && (
          trendsLoading ? <Skeleton className="w-full h-full rounded-xl" /> :
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends?.revenue_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `$${val}`} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "forecast" && (
          forecastLoading ? <Skeleton className="w-full h-full rounded-xl" /> :
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast?.forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `$${val}`} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="best_case" name="Best Case" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="expected" name="Expected" stroke="#10b981" strokeWidth={3} fillOpacity={0.2} fill="#10b981" />
              <Area type="monotone" dataKey="worst_case" name="Worst Case" stroke="#f59e0b" fillOpacity={0.1} fill="#f59e0b" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "costs" && (
          aiCostsLoading ? <Skeleton className="w-full h-full rounded-xl" /> :
          <div className="flex flex-col md:flex-row h-full gap-8">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiCosts?.providers} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(val) => `$${val}`} />
                  <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }} content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Cost" radius={[0, 4, 4, 0]}>
                    {aiCosts?.providers?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/3 flex flex-col justify-between bg-slate-50/70 dark:bg-black/30 p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-inner">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total AI Cost</h4>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight pt-1">
                  ${aiCosts?.total_estimated_cost?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated real-time provider expense</p>
              </div>

              <div className="h-px w-full bg-slate-200/80 dark:bg-white/10 my-4" />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Profit Margin</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Healthy
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight pt-1">
                  {aiCosts?.margin !== undefined ? `${aiCosts.margin.toFixed(1)}%` : "0.0%"}
                </div>
                <div className="w-full bg-slate-200/80 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(Math.max(aiCosts?.margin || 0, 0), 100)}%` }} 
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">Cost vs Total MRR</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
