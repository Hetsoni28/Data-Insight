import React from "react"
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, AlertTriangle, Target } from "lucide-react"

interface TrendForecastViewerProps {
  report: any
}

export function TrendForecastViewer({ report }: TrendForecastViewerProps) {
  const data = report?.ai_blueprint
  if (!data) return <div className="p-8 text-center text-slate-500 font-medium">No Trend Forecast configuration found.</div>

  const chartData = data.predictedTrendline?.map((item: any) => ({
    ...item,
    confidenceBound: item.pessimisticBound && item.optimisticBound 
      ? [item.pessimisticBound, item.optimisticBound] 
      : null,
    historical: item.historicalValue,
    predicted: item.predictedValue
  }))

  return (
    <div className="w-full bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
      
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4 flex items-center gap-3 border-b border-emerald-800/40">
        <TrendingUp className="w-6 h-6 text-white/80 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white truncate">{data.forecastTitle || report.title}</h2>
          <p className="text-xs text-emerald-100/80 leading-tight">Predictive Machine Learning & Growth Modeling</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Executive Summary strip */}
        {data.executiveSummary && (
          <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{data.executiveSummary}</p>
          </div>
        )}

        {/* Forecast Chart */}
        <div className="bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">Predictive Trendline</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 15, right: 15, bottom: 25, left: -10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} dy={5} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={45} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(value: any, name?: any) => {
                  if (name === "Confidence Interval" && Array.isArray(value)) {
                    return [`${value[0]} - ${value[1]}`, name]
                  }
                  return [value, name || ""]
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              
              <Area type="monotone" dataKey="confidenceBound" fill="#cbd5e1" stroke="none" fillOpacity={0.4} name="Confidence Interval" />
              <Line type="monotone" dataKey="historical" stroke="#64748b" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Historical Data" connectNulls />
              <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3, stroke: '#10b981', strokeWidth: 2, fill: 'white' }} activeDot={{ r: 5 }} name="AI Prediction" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Drivers and Risks — 2 cols */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 p-4">
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" /> Growth Drivers
            </h3>
            <ul className="space-y-2">
              {data.growthDrivers?.map((driver: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{driver}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-900/40 p-4">
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Risk Factors
            </h3>
            <ul className="space-y-2">
              {data.riskFactors?.map((risk: string, i: number) => (
                <li key={i} className="flex gap-2 text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
