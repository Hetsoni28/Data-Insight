import { useState, useEffect, useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"

interface StorageAnalyticsChartsProps {
  trends?: {
    date: string
    daily_bytes: number
    cumulative_bytes: number
  }[]
  overview?: {
    kpis: {
      categories: {
        dataset: number
        report: number
        ai_generated: number
        image: number
      }
    }
  }
}

export function StorageAnalyticsCharts({ trends = [], overview }: StorageAnalyticsChartsProps) {
  const categories = overview?.kpis?.categories || { dataset: 0, report: 0, ai_generated: 0, image: 0 }
  
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const pieData = useMemo(() => {
    const data = [
      { name: 'Datasets', value: categories.dataset, color: '#10b981' },
      { name: 'Reports', value: categories.report, color: '#3b82f6' },
      { name: 'AI Gen', value: categories.ai_generated, color: '#8b5cf6' },
      { name: 'Images', value: categories.image, color: '#f59e0b' }
    ].filter(d => d.value > 0)

    if (data.length === 0) {
      data.push({ name: 'Empty', value: 1, color: '#cbd5e1' })
    }
    return data
  }, [categories])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatGb = (bytes: number) => {
    return (bytes / (1024**3)).toFixed(1) + 'GB'
  }

  if (!mounted) return <div className="w-full h-[280px] rounded-xl bg-slate-100 dark:bg-white/10 animate-pulse" />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Growth Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-800 dark:text-white">Storage Growth (30 Days)</h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => {
                  const d = new Date(val)
                  return `${d.getMonth()+1}/${d.getDate()}`
                }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => formatGb(val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0B0F17] text-white p-3 rounded-xl shadow-xl border border-white/10">
                        <p className="text-slate-300 text-xs mb-1">{payload[0].payload.date}</p>
                        <p className="font-semibold text-emerald-400">Total: {formatBytes(payload[0].value as number)}</p>
                        <p className="text-xs text-slate-400 mt-1">Uploaded: {formatBytes(payload[0].payload.daily_bytes)}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area 
                type="monotone" 
                dataKey="cumulative_bytes" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorGrowth)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-6">Storage Distribution</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                 content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0B0F17] text-white px-3 py-2 rounded-xl shadow-xl border border-white/10">
                        <p className="text-sm font-medium">{payload[0].name}: {payload[0].value}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {pieData.map(item => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
