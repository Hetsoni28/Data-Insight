"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function OrganizationAnalytics({ chartData }: { chartData: any[] }) {
  if (!chartData || chartData.length === 0) return null

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Business Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">30-day activity across AI requests and reports.</p>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-white/5" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#1e293b', fontSize: '14px', fontWeight: 500 }}
              labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}
            />
            <Area type="monotone" name="AI Requests" dataKey="ai_usage" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorAi)" />
            <Area type="monotone" name="Reports Generated" dataKey="reports" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
