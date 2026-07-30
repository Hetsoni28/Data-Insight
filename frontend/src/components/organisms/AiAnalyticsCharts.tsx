"use client"

import { motion } from "framer-motion"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell
} from "recharts"
import { Bot, Zap, Clock, Coins, Activity } from "lucide-react"

// Mock Data
const tokenUsageData = [
  { date: "Jul 23", gpt4: 12000, claude: 8000, llama: 2000 },
  { date: "Jul 24", gpt4: 15000, claude: 9500, llama: 2500 },
  { date: "Jul 25", gpt4: 18000, claude: 11000, llama: 3000 },
  { date: "Jul 26", gpt4: 14000, claude: 9000, llama: 2100 },
  { date: "Jul 27", gpt4: 21000, claude: 13000, llama: 4000 },
  { date: "Jul 28", gpt4: 25000, claude: 16000, llama: 5500 },
  { date: "Jul 29", gpt4: 32000, claude: 21000, llama: 8000 },
]

const modelDistributionData = [
  { name: 'GPT-4o', value: 45, color: '#10b981' }, // Emerald
  { name: 'Claude 3.5', value: 35, color: '#8b5cf6' }, // Violet
  { name: 'Llama 3', value: 15, color: '#f59e0b' }, // Amber
  { name: 'Other', value: 5, color: '#94a3b8' }, // Slate
]

const latencyData = [
  { time: "00:00", p50: 240, p99: 850 },
  { time: "04:00", p50: 230, p99: 820 },
  { time: "08:00", p50: 280, p99: 1100 },
  { time: "12:00", p50: 310, p99: 1450 },
  { time: "16:00", p50: 290, p99: 1250 },
  { time: "20:00", p50: 250, p99: 900 },
]

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
  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Tokens Generated", value: "1.24M", change: "+18%", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Active AI Models", value: "4", change: "Stable", icon: Bot, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Avg. Latency (p99)", value: "1,150ms", change: "-120ms", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Est. AI Cost", value: "$4,250", change: "+5%", icon: Coins, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((metric, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-md ${metric.bg}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${metric.change.startsWith('+') && !metric.change.includes('%') ? 'bg-rose-50 text-rose-600' : metric.change.startsWith('-') || metric.change === 'Stable' ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-50 text-emerald-600'}`}>
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
                Token Usage by Model
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daily aggregation of input + output tokens across platform.</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenUsageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGpt4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClaude" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="gpt4" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#colorGpt4)" />
                <Area type="monotone" dataKey="claude" stackId="1" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorClaude)" />
                <Area type="monotone" dataKey="llama" stackId="1" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.1} />
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
                    {modelDistributionData.map((entry, index) => (
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
              {modelDistributionData.map((model, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: model.color }} />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{model.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Latency Line Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-6 shadow-sm"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">API Latency</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">p50 vs p99 response times (ms).</p>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={5} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '6px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
