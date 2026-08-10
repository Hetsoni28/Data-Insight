"use client"
import { useState } from "react"
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartTooltip } from "@/components/molecules/ChartTooltip"

interface ChartPoint { date: string; ai_usage: number; reports: number; storage_mb: number }

export function OrganizationAnalytics({ chartData }: { chartData: ChartPoint[] }) {
  const [activeChart, setActiveChart] = useState<"area" | "bar">("area")
  if (!chartData || chartData.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 shadow-sm h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">30-Day Activity Overview</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">AI usage, reports created, and storage growth</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {(["area", "bar"] as const).map(t => (
            <button key={t} onClick={() => setActiveChart(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                activeChart === t
                  ? "bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-emerald-500/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {activeChart === "area" ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gAI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gStore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#64748b" }} />
            <Area type="monotone" dataKey="ai_usage" name="AI Usage" stroke="#06B6D4" fill="url(#gAI)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="reports" name="Reports" stroke="#10B981" fill="url(#gRep)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="storage_mb" name="Storage (MB)" stroke="#F59E0B" fill="url(#gStore)" strokeWidth={2} dot={false} />
          </AreaChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#64748b" }} />
            <Bar dataKey="ai_usage" name="AI Usage" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reports" name="Reports" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="storage_mb" name="Storage (MB)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
