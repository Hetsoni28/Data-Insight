"use client"

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface DynamicNLChartProps {
  data: any
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"]

export function DynamicNLChart({ data }: DynamicNLChartProps) {
  if (!data || data.type === "empty") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>No results found for this query.</p>
      </div>
    )
  }

  if (data.type === "kpi") {
    return (
      <div className="flex flex-col h-64 justify-center items-center text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <h4 className="text-lg font-semibold text-slate-500 mb-2">{data.title}</h4>
        <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
          {data.kpi_metrics?.[0]?.value ?? "0"}
        </div>
        {data.kpi_metrics?.[0]?.subtitle && (
          <p className="text-sm text-slate-400 mt-2">{data.kpi_metrics[0].subtitle}</p>
        )}
      </div>
    )
  }

  const { chart_type, title, x_key, y_key, data: chartData } = data

  const renderChart = () => {
    switch (chart_type) {
      case "line":
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={x_key} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => String(val)} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey={y_key} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        )
      case "area":
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={x_key} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey={y_key} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          </AreaChart>
        )
      case "pie":
        return (
          <PieChart>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Pie data={chartData} dataKey={y_key} nameKey={x_key} cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((_: any, index: number) => (
                <Cell key={cell-$index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        )
      case "bar":
      default:
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={x_key} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey={y_key} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {data.kpi_metrics && data.kpi_metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          {data.kpi_metrics.map((kpi: any, idx: number) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
