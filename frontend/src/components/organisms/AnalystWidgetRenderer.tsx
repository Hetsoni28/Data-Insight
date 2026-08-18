"use client"

import React, { useMemo } from 'react'
import { DashboardWidget } from '@/store/useBuilderStore'
import { useQuery } from '@tanstack/react-query'
import { DashboardQueryService } from '@/lib/services/dashboard-query.service'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell 
} from 'recharts'
import { Loader2, AlertCircle, X, Settings2, GripHorizontal, TrendingUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AnalystWidgetRendererProps {
  widget: DashboardWidget
  isPreviewMode?: boolean
  onRemove: () => void
  isSelected?: boolean
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6']

/** Smart number formatter — avoids floating-point ugliness */
function formatNumber(value: number): string {
  if (!isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B'
  if (abs >= 1_000_000)     return (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  if (abs >= 1_000)         return (value / 1_000).toFixed(2).replace(/\.?0+$/, '') + 'K'
  // For values with decimals, show at most 2 decimal places and strip trailing zeros
  if (Number.isInteger(value)) return value.toLocaleString()
  return parseFloat(value.toFixed(2)).toLocaleString()
}

/** Formats raw column names like UNITPRICE or total_spend into readable labels */
function formatLabel(str: string): string {
  if (!str) return ''
  let result = str.replace(/([a-z])([A-Z])/g, '$1 $2')
  result = result.replace(/_/g, ' ')
  if (result === result.toUpperCase() && !result.includes(' ')) {
    result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()
  } else {
    result = result.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  }
  return result
}

/** Custom tooltip shared across all chart types */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 text-sm">
      {label && <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">{formatLabel(String(label))}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-6">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {formatLabel(p.name)}
          </span>
          <span style={{ color: p.color || COLORS[0] }} className="font-bold text-base">
            {formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalystWidgetRenderer({ widget, isPreviewMode, onRemove, isSelected }: AnalystWidgetRendererProps) {
  const dim = widget.config?.dimension || widget.config?.xAxis
  const met = widget.config?.metric || widget.config?.yAxis

  const isDataWidget = widget.type !== 'markdown' && widget.type !== 'ai_insight'
  
  const isValidConfigValue = (val: string | undefined) => val && val.trim() !== "" && !val.startsWith("Select");
  const isValidUUID = (id: string | undefined) => id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const isConfigured =
    widget.type === 'markdown' ||
    widget.type === 'ai_insight' ||
    (isValidUUID(widget.config?.dataset_id) && isValidConfigValue(met) && (
      (widget.type === 'kpi') ||
      (isValidConfigValue(dim))
    ))

  const { data: queryResult, isLoading, error } = useQuery({
    queryKey: ['widget-data', widget.id, widget.config],
    queryFn: () => {
      if (!isDataWidget) return null
      // Clean up the payload to avoid sending hallucinated placeholders
      const cleanDimension = widget.type !== 'kpi' && isValidConfigValue(dim) ? dim : undefined;
      const cleanMetric = isValidConfigValue(met) ? met : undefined;

      return DashboardQueryService.executeQuery(widget.config.dataset_id!, {
        dimension: cleanDimension,
        metric: cleanMetric,
        aggregation: widget.config.aggregation || 'SUM',
        limit: widget.config.limit || 20,
        sort: widget.config.sort || undefined
      })
    },
    enabled: !!isConfigured && isDataWidget,
  })

  const chartData = useMemo(() => {
    if (!queryResult || !queryResult.rows || !met) return []
    const dimIndex = dim ? queryResult.columns.indexOf(dim) : -1
    const metricIndex = queryResult.columns.indexOf(met)
    if (metricIndex === -1) return []
    if (widget.type !== 'kpi' && dimIndex === -1) return []
    return queryResult.rows.map((row: any[]) => ({
      name: dimIndex !== -1 && row[dimIndex] !== null ? String(row[dimIndex]) : 'Total',
      // Round to 4 decimal places to eliminate floating-point noise, then let formatNumber handle display
      value: Math.round((Number(row[metricIndex]) || 0) * 10000) / 10000,
    }))
  }, [queryResult, widget.config, dim, met])

  // ── Shared chart styles ────────────────────────────────────────────────
  const axisStyle = { fontSize: 11, fill: '#94a3b8' }
  const gridStyle = { strokeDasharray: '3 3', vertical: false, stroke: '#f1f5f9' }
  const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)' }

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderConfigPlaceholder = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900/50 m-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3">
        <Settings2 className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Not Configured</h3>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Click this widget and use the Properties panel to connect data.
      </p>
    </div>
  )

  const renderContent = () => {
    if (!isConfigured) return renderConfigPlaceholder()

    if (isLoading) return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )

    if (error) {
      const status = (error as any)?.response?.status
      
      // If the AI hallucinated an invalid column (422) or dataset (404), gracefully fall back to the config placeholder
      if (status === 422 || status === 404) {
        return renderConfigPlaceholder()
      }

      const errMsg = (error as any)?.response?.data?.detail || (error as any)?.message || 'Query failed'
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Data load failed</p>
          <p className="text-xs text-slate-400 max-w-[200px] leading-snug">{errMsg}</p>
        </div>
      )
    }

    // ── Markdown / AI Insight ──────────────────────────────────────────
    if (widget.type === 'markdown' || widget.type === 'ai_insight') {
      return (
        <div className="flex-1 overflow-auto p-5 prose dark:prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {widget.config?.text || '*No content*'}
          </ReactMarkdown>
        </div>
      )
    }

    // ── KPI Scorecard ──────────────────────────────────────────────────
    if (widget.type === 'kpi') {
      const total = chartData.reduce((acc: number, item: any) => acc + item.value, 0)
      return (
        <div className="flex-1 flex flex-col justify-center px-6 py-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{formatLabel(met)}</p>
          <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatNumber(total)}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {chartData.length} {chartData.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      )
    }

    // ── Bar Chart ──────────────────────────────────────────────────────
    if (widget.type === 'chart_bar') {
      return (
        <div className="flex-1 p-2 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                interval="preserveStartEnd"
                tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                tickFormatter={formatNumber}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="value" fill={widget.config?.color || COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // ── Line Chart ─────────────────────────────────────────────────────
    if (widget.type === 'chart_line') {
      return (
        <div className="flex-1 p-2 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={chartData} margin={{ top: 12, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                interval="preserveStartEnd"
                tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                tickFormatter={formatNumber}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={widget.config?.color || COLORS[1]}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // ── Pie Chart ──────────────────────────────────────────────────────
    if (widget.type === 'chart_pie') {
      return (
        <div className="flex-1 p-3 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius="40%"
                outerRadius="65%"
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => {
                  const formatted = formatLabel(value);
                  return (
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {formatted.length > 15 ? formatted.slice(0, 15) + '…' : formatted}
                    </span>
                  )
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // ── Data Table ─────────────────────────────────────────────────────
    if (widget.type === 'data_table') {
      return (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <tr>
                {dim && <th className="px-4 py-2.5 font-bold">{formatLabel(dim)}</th>}
                <th className="px-4 py-2.5 font-bold text-right pr-6">{formatLabel(met)}</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row: any, i: number) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {dim && (
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {row.name}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-right pr-6 tabular-nums text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                    {formatNumber(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Unsupported widget type: <code className="ml-1 font-mono">{widget.type}</code>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      {!isPreviewMode ? (
        <div className={`flex items-center justify-between px-3 py-2 border-b transition-colors shrink-0 ${
          isSelected
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
            : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="drag-handle cursor-move p-1 -ml-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
              {widget.title}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-slate-400 hover:text-red-500 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 rounded-t-2xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{widget.title}</h3>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-900">
        {renderContent()}
      </div>
    </div>
  )
}
