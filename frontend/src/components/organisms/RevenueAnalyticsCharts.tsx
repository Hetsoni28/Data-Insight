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

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl">
        <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span>${Number(entry.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </p>
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


  if (!mounted) return <div className="w-full h-[320px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Financial Analytics</h3>
          <p className="text-sm text-slate-500">Analyze revenue, forecasts, and API costs in real-time.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 bg-slate-100 dark:bg-slate-900">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
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
                <BarChart data={aiCosts?.providers} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `$${val}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Cost" radius={[0, 4, 4, 0]}>
                    {aiCosts?.providers?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/3 flex flex-col justify-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total AI Cost</h4>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">${aiCosts?.total_estimated_cost?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>
              <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2" />
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Profit Margin</h4>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{aiCosts?.margin?.toFixed(1)}%</div>
                <p className="text-xs text-slate-500 mt-1">Cost vs Total MRR</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
