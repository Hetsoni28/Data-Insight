"use client"

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { DatasetService } from "@/lib/dataset.service"
import { DashboardQueryService } from "@/lib/services/dashboard-query.service"
import { ChartBase } from "@/lib/services/chart.service"
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"
import { AlertCircle, Loader2, BarChart2 } from "lucide-react"
import { useDebounce } from "use-debounce"

interface AnalystChartPreviewProps {
  config: Partial<ChartBase>
}

// Emerald palette
const COLORS = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857', '#a7f3d0']

export function AnalystChartPreview({ config }: AnalystChartPreviewProps) {
  // Debounce the entire config to prevent spamming queries
  const [debouncedConfig] = useDebounce(config, 500)
  
  const cJSON = debouncedConfig.configuration_json || {}
  const { dimension, metric, aggregation, limit } = cJSON
  const datasetId = debouncedConfig.dataset_id

  const isValidConfigValue = (val: string | undefined) => val && val.trim() !== "" && !val.toLowerCase().includes("select");
  const isValidUUID = (id: string | undefined) => id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  // We only run query if we have both dimension and metric and they are valid
  const isValid = !!(isValidUUID(datasetId) && isValidConfigValue(dimension) && isValidConfigValue(metric))

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['structured-query', datasetId, dimension, metric, aggregation, limit],
    queryFn: async ({ signal }) => {
      if (!isValid) return { data: [] }
      
      const cleanDimension = isValidConfigValue(dimension) ? dimension : undefined;
      const cleanMetric = isValidConfigValue(metric) ? metric : undefined;

      // Using DashboardQueryService.executeQuery which calls the actual endpoint
      return DashboardQueryService.executeQuery(datasetId, {
        dimension: cleanDimension,
        metric: cleanMetric,
        aggregation: aggregation || 'sum',
        limit: limit || 100,
        sort: cJSON.sort || undefined
      })
    },
    enabled: isValid,
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  })

  const chartData = React.useMemo(() => {
    if (!data || !data.rows || !data.columns) return data?.data || []
    return data.rows.map((row: any[]) => {
      const obj: any = {}
      data.columns.forEach((col: string, i: number) => {
        obj[col] = row[i]
      })
      return obj
    })
  }, [data])

  // Calculate KPI summary stats from chartData
  const stats = React.useMemo(() => {
    if (!chartData || chartData.length === 0 || !metric) return null
    let total = 0
    let max = -Infinity
    let count = 0

    chartData.forEach((row: any) => {
      const val = Number(row[metric])
      if (!isNaN(val)) {
        total += val
        if (val > max) max = val
        count++
      }
    })

    const avg = count > 0 ? total / count : 0
    return {
      total,
      avg,
      max: max === -Infinity ? 0 : max,
      count
    }
  }, [chartData, metric])

  // Vibrant modern palette for charts
  const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#3b82f6']

  // Smart Currency / Number Formatter
  const formatMetricValue = (val: any, metricName: string = '') => {
    if (typeof val !== 'number') return val
    const nameToTest = metricName || metric || ''
    const isCurrency = /monthly|charge|revenue|cost|price|amount|total|fee|pay|salary|income|expense/i.test(nameToTest)
    const formatted = new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 2,
      minimumFractionDigits: isCurrency ? 2 : 0 
    }).format(val)
    return isCurrency ? `$${formatted}` : formatted
  }

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md p-3.5 rounded-xl shadow-xl text-xs space-y-2 min-w-[160px]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">{dimension || 'Key'}</span>
            <span className="text-slate-900 dark:text-white font-black">{label}</span>
          </div>
          {payload.map((entry: any, index: number) => {
            const itemColor = entry.color || entry.fill || COLORS[index % COLORS.length]
            const name = entry.name || metric
            return (
              <div key={index} className="flex items-center justify-between gap-3 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: itemColor }} />
                  <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                    {name}:
                  </span>
                </div>
                <span className="font-mono font-black text-xs" style={{ color: itemColor }}>
                  {formatMetricValue(entry.value, name)}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  // Smart tick formatter for numbers
  const formatYAxisTick = (val: any) => {
    if (typeof val !== 'number') return val
    const isCurrency = /monthly|charge|revenue|cost|price|amount|total|fee|pay|salary|income|expense/i.test(metric || '')
    const prefix = isCurrency ? '$' : ''
    if (Math.abs(val) >= 1000000) return `${prefix}${(val / 1000000).toFixed(1)}M`
    if (Math.abs(val) >= 1000) return `${prefix}${(val / 1000).toFixed(0)}k`
    return `${prefix}${val}`
  }

  // Common axis styles
  const axisStyles = {
    tick: { fill: '#64748b', fontSize: 11, fontWeight: 600 },
    axisLine: { stroke: '#cbd5e1', strokeWidth: 1.5 },
    tickLine: { stroke: '#cbd5e1' }
  }

  const renderPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50/30 dark:bg-slate-950/30">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/20 dark:from-emerald-500/20 dark:to-teal-400/10 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-inner">
        <BarChart2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 tracking-tight">Build & Preview Visualizations</h3>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
        Select a dataset on the left panel, choose your X-axis Dimension and Y-axis Metric to generate real-time charts powered by DuckDB.
      </p>
    </div>
  )

  if (!isValid) {
    return renderPlaceholder()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-emerald-500 bg-slate-50/30 dark:bg-slate-950/30">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Executing DuckDB Query</p>
        <p className="text-[10px] font-medium text-slate-400 mt-1">Aggregating columns & processing data...</p>
      </div>
    )
  }

  if (isError) {
    const status = (error as any)?.response?.status
    if (status === 422 || status === 404) {
      return renderPlaceholder()
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center bg-red-50/10 dark:bg-red-950/10">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Preview Execution Failed</h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm">
          {((error as any)?.response?.data?.detail) || ((error as any)?.message) || 'Check your dataset and configuration.'}
        </p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/30 dark:bg-slate-950/30">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
          <BarChart2 className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No matching data returned for this configuration.</p>
        <p className="text-[10px] text-slate-400 mt-1">Try selecting a different metric, dimension, or adjusting filters.</p>
      </div>
    )
  }

  const renderChart = () => {
    switch (config.chart_type) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 25, right: 35, left: 15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
            <XAxis dataKey={dimension} {...axisStyles} />
            <YAxis {...axisStyles} width={65} tickFormatter={formatYAxisTick} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b', paddingTop: '12px' }} />
            <Line 
              type="monotone" 
              dataKey={metric} 
              stroke={COLORS[0]} 
              strokeWidth={3.5} 
              dot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: COLORS[0] }} 
              activeDot={{ r: 8, strokeWidth: 0, fill: COLORS[0] }} 
              animationDuration={1000} 
            />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 25, right: 35, left: 15, bottom: 25 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.45}/>
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
            <XAxis dataKey={dimension} {...axisStyles} />
            <YAxis {...axisStyles} width={65} tickFormatter={formatYAxisTick} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b', paddingTop: '12px' }} />
            <Area 
              type="monotone" 
              dataKey={metric} 
              stroke={COLORS[0]} 
              strokeWidth={3.5} 
              fillOpacity={1} 
              fill="url(#colorMetric)" 
              dot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: COLORS[0] }} 
              activeDot={{ r: 8, strokeWidth: 0, fill: COLORS[0] }} 
              animationDuration={1000} 
            />
          </AreaChart>
        )
      case 'pie':
        return (
          <PieChart margin={{ top: 25, right: 35, left: 15, bottom: 25 }}>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b', paddingTop: '12px' }} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={125}
              paddingAngle={4}
              dataKey={metric}
              nameKey={dimension}
              animationDuration={1000}
            >
              {chartData.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        )
      case 'bar':
      default:
        return (
          <BarChart data={chartData} margin={{ top: 25, right: 35, left: 15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
            <XAxis dataKey={dimension} {...axisStyles} />
            <YAxis {...axisStyles} width={65} tickFormatter={formatYAxisTick} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
            <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, color: '#64748b', paddingTop: '12px' }} />
            <Bar dataKey={metric} fill={COLORS[0]} radius={[8, 8, 0, 0]} animationDuration={1000} maxBarSize={60} />
          </BarChart>
        )
    }
  }

  return (
    <div className="flex-1 w-full h-full p-6 md:p-8 flex flex-col justify-between relative overflow-y-auto custom-scrollbar">
      {/* Top Chart Toolbar & Info Header */}
      <div className="flex items-start justify-between z-10 gap-4 mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {config.name || 'Untitled Visualization'}
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Dimension: <strong className="text-slate-800 dark:text-slate-200">{dimension}</strong></span>
            <span>•</span>
            <span>Metric: <strong className="text-emerald-600 dark:text-emerald-400">{metric}</strong> ({aggregation?.toUpperCase()})</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {chartData.length} Records
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {stats && stats.count > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Aggregated</span>
            <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {formatMetricValue(stats.total, metric)}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Average per Group</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {formatMetricValue(stats.avg, metric)}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Peak Group Value</span>
            <span className="text-base font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5 block">
              {formatMetricValue(stats.max, metric)}
            </span>
          </div>
        </div>
      )}

      {/* Chart Render Canvas */}
      <div className="w-full flex-1 pt-2 pb-2 min-h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
