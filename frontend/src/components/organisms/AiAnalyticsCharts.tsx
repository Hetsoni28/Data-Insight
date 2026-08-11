"use client"

import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell
} from "recharts"
import { Bot, Zap, Clock, Coins, Activity } from "lucide-react"

// Custom Tooltip for Area Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl rounded-md p-3 text-sm">
        <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-400 capitalize">{entry.name}:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function AiAnalyticsCharts() {
  const { data: chartsData, isLoading } = useQuery({
    queryKey: ['owner-ai-analytics-charts'],
    queryFn: async () => {
      const res = await api.get('/owner/ai/analytics-charts');
      return res.data;
    }
  });

  const { data: overview } = useQuery({
    queryKey: ['owner-ai-overview'],
    queryFn: async () => {
      const res = await api.get('/owner/ai/overview');
      return res.data;
    }
  });

  const tokenUsageData = chartsData?.tokenUsageData || [];
  const modelDistributionData = chartsData?.modelDistributionData || [];
  const latencyData = chartsData?.latencyData || [];

  if (isLoading) {
    return <div className="w-full h-[500px] bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
  }

  const kpis = overview?.kpis;

  // Compute real period-over-period trends from the timeseries
  const computeTrend = (arr: any[], key: string): string => {
    if (!arr || arr.length < 2) return "Live";
    const first = Number(arr[0]?.[key] ?? 0);
    const last = Number(arr[arr.length - 1]?.[key] ?? 0);
    if (first === 0) return last > 0 ? "+∞" : "Stable";
    const pct = ((last - first) / first) * 100;
    return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
  };

  const requestsTrend = computeTrend(tokenUsageData, "requests");
  const costTrend = computeTrend(tokenUsageData, "cost");
  const latencyTrend = computeTrend(latencyData, "p50");
  const modelsTrend = (kpis?.available_models ?? 0) > 0 ? "Stable" : "None";

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Monthly Requests", value: (kpis?.monthly_requests || 0).toLocaleString(), change: requestsTrend, icon: Zap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { title: "Active AI Models", value: (kpis?.available_models || 0).toString(), change: modelsTrend, icon: Bot, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { title: "Avg. Latency", value: `${kpis?.avg_latency_ms || 0}ms`, change: latencyTrend, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", inverse: true },
          { title: "Monthly AI Cost", value: `$${(kpis?.monthly_cost_usd || 0).toLocaleString()}`, change: costTrend, icon: Coins, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10", inverse: true },
        ].map((metric, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-none p-5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-md ${metric.bg}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                metric.change === "Stable" || metric.change === "Live"
                  ? 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  : (metric.change.startsWith('+') ? !metric.inverse : metric.inverse)
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {metric.change}
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.title}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Token Usage Over Time */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                API Usage (Requests & Cost)
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daily aggregation of API requests and estimated cost.</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenUsageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val > 1000 ? val / 1000 + 'k' : val}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} fill="url(#colorRequests)" />
                <Area yAxisId="right" type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Model Distribution & Latency */}
        <div className="space-y-6">
          
          {/* Model Distribution Pie */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-6 shadow-sm"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Model Distribution</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Percentage of total API calls.</p>
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {modelDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">100%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {modelDistributionData.map((model: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: model.color }} />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{model.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Latency Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-6 shadow-sm flex-1"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              API Latency (p99)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Average response time for LLM calls today.</p>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}ms`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                  />
                  <Line type="monotone" dataKey="p99" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="p50" stroke="#94a3b8" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
