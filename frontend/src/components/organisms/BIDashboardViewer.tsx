import React from "react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { LayoutDashboard, FileSpreadsheet } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface BIDashboardViewerProps {
  report: any
}

const COLORS = ['#059669', '#0284c7', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#ef4444', '#8b5cf6']

export function BIDashboardViewer({ report }: BIDashboardViewerProps) {
  const data = report?.ai_blueprint
  if (!data) return <div className="p-8 text-center text-slate-500 font-medium">No BI Dashboard configuration found.</div>

  const handleExport = async () => {
    toast.loading("Preparing Excel export...", { id: `dl-${report.id}` })
    try {
      const res = await api.get(`/tenant-reports/${report.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}_${report.id.substring(0, 8)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Export complete!", { id: `dl-${report.id}` })
    } catch (e) {
      toast.error("Failed to export dashboard", { id: `dl-${report.id}` })
    }
  }

  const renderChart = (chartConfig: any) => {
    const type = chartConfig.chartType?.toLowerCase()
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={chartConfig.data} margin={{ top: 10, right: 15, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={45} />
              <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={chartConfig.data} margin={{ top: 10, right: 15, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={45} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ strokeWidth: 2, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={chartConfig.data} margin={{ top: 10, right: 15, left: -15, bottom: 25 }}>
              <defs>
                <linearGradient id={`areaGrad${chartConfig.title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={5} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={45} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill={`url(#areaGrad${chartConfig.title})`} />
            </AreaChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={chartConfig.data}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={85}
                paddingAngle={4} dataKey="value"
              >
                {chartConfig.data?.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )
      default:
        return <div className="p-10 text-center text-sm text-slate-400">Unsupported chart type: {chartConfig.chartType}</div>
    }
  }

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4 flex items-center justify-between gap-4 border-b border-emerald-800/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-white/80 shrink-0" />
            <h2 className="text-base font-bold text-white truncate">{data.dashboardTitle || report.title}</h2>
          </div>
          {data.dashboardSummary && (
            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed line-clamp-2">{data.dashboardSummary}</p>
          )}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl text-sm font-bold transition-all shadow-lg shrink-0 border border-emerald-100/50 group"
        >
          <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
          Download as Excel
        </button>
      </div>

      {/* ── CHART GRID: 2 cols, fixed ── */}
      <div className="p-5 grid grid-cols-2 gap-5">
        {data.charts?.map((chart: any, i: number) => (
          <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{chart.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{chart.description}</p>
            </div>
            {renderChart(chart)}
          </div>
        ))}
      </div>
    </div>
  )
}
