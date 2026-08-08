"use client"

import React, { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react"
import api from "@/lib/api"
import { Activity, BarChart3, FileText, LineChart, PieChart, Sparkles, Type, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface LiveWidgetRendererProps {
  widget: any
}

export function LiveWidgetRenderer({ widget }: LiveWidgetRendererProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const hasDataset = !!widget.config?.dataset_id

  useEffect(() => {
    if (hasDataset && (widget.type.startsWith('chart_') || widget.type === 'kpi' || widget.type === 'data_table')) {
      fetchData()
    }
  }, [widget.config?.dataset_id, widget.config?.xAxis, widget.config?.yAxis, widget.type])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (widget.config.dataset_id.length !== 36) {
        throw new Error("Invalid Dataset ID format")
      }

      const xCol = widget.config.xAxis || 'Category'
      const yCol = widget.config.yAxis || 'Value'
      
      let sql = ""
      
      if (widget.type === 'kpi') {
        // Just sum the Y column
        sql = `SELECT SUM(CAST("${yCol}" AS DOUBLE)) as y_val FROM dataset`
      } else if (widget.type === 'chart_scatter') {
        // Don't aggregate scatter
        sql = `SELECT "${xCol}" as x_val, CAST("${yCol}" AS DOUBLE) as y_val FROM dataset LIMIT 100`
      } else if (widget.type === 'data_table') {
        sql = `SELECT "${xCol}" as x_val, "${yCol}" as y_val FROM dataset LIMIT 50`
      } else {
        // Bar, Line, Pie -> Aggregate
        sql = `SELECT "${xCol}" as x_val, SUM(CAST("${yCol}" AS DOUBLE)) as y_val FROM dataset GROUP BY "${xCol}" ORDER BY y_val DESC LIMIT 15`
      }

      const res = await api.post(`/datasets/${widget.config.dataset_id}/query`, {
        sql: sql,
        limit: 100,
        offset: 0
      })
      
      // DuckDB returns rows like [[ "Jan", 100 ]] and columns like ["x_val", "y_val"]
      const rawRows = res.data?.data?.rows || res.data?.rows || []
      const cols = res.data?.data?.columns || res.data?.columns || []
      
      const mappedData = rawRows.map((row: any[]) => {
        const obj: any = {}
        cols.forEach((col: string, i: number) => {
          let val = row[i];
          // Round floating point numbers to 2 decimal places
          if (typeof val === 'number' && !Number.isInteger(val)) {
            val = Math.round(val * 100) / 100;
          }
          obj[col] = val
        })
        return obj
      })
      
      setData(mappedData)
    } catch (err: any) {
      // Don't use console.error to avoid aggressive Next.js dev overlays
      console.warn("Failed to fetch widget data", err)
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Failed to execute query"
      setError(msg)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // If it's not configured yet
  if (!hasDataset && widget.type !== 'markdown' && widget.type !== 'ai_insight') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
        <DatabaseIcon type={widget.type} />
        <span className="text-xs mt-2">Select Dataset in Properties</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full p-4 flex flex-col justify-end space-y-2 animate-pulse">
        <div className="w-full h-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="w-full h-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="w-3/4 h-1/4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center text-red-500">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm font-medium">{error}</span>
        <span className="text-xs mt-1 text-slate-500">Check Dataset and Axis configuration</span>
      </div>
    )
  }

  if (widget.type === 'kpi') {
    // KPI Data might just be one row [{ y_val: 123 }]
    const val = data && data.length > 0 ? data[0].y_val : 0;
    
    return (
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-sm font-medium text-slate-500 mb-1">{widget.config?.yAxis || 'Metric'}</div>
        <div className="text-3xl xl:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight truncate">
          {typeof val === 'number' ? new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(val) : val}
        </div>
        <div className="text-xs font-medium text-emerald-500 flex items-center">
          <Activity className="w-3 h-3 mr-1" /> Live from DuckDB
        </div>
      </div>
    )
  }

  if (widget.type === 'ai_insight' || widget.type === 'markdown') {
    return (
      <div className="w-full h-full overflow-y-auto p-4 text-sm text-slate-700 dark:text-slate-300">
        <div className="text-sm text-slate-700 dark:text-slate-300">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
              p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
              a: ({node, ...props}) => <a className="text-emerald-600 hover:underline" {...props} />,
            }}
          >
            {widget.config?.text || 'Configure text in properties...'}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  if (widget.type === 'data_table') {
    return (
      <div className="w-full h-full overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">{widget.config?.xAxis || 'ID'}</th>
              <th className="px-4 py-3">{widget.config?.yAxis || 'Value'}</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((row: any, i: number) => (
              <tr key={i} className="border-b border-slate-100 dark:border-white/5">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.x_val}</td>
                <td className="px-4 py-3">{row.y_val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ECharts Configurations
  if (data && (widget.type === 'chart_bar' || widget.type === 'chart_line' || widget.type === 'chart_pie' || widget.type === 'chart_scatter')) {
    const xData = data.map((d: any) => d.x_val)
    const yData = data.map((d: any) => d.y_val)

    let option: any = {
      tooltip: { trigger: 'axis', confine: true },
      grid: { top: 30, right: 20, bottom: 30, left: 10, containLabel: true },
      xAxis: { type: 'category', data: xData, axisLine: { lineStyle: { color: '#94a3b8' } } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } }, axisLine: { lineStyle: { color: '#94a3b8' } } },
      series: []
    }

    if (widget.type === 'chart_bar') {
      option.series = [{ type: 'bar', data: yData, itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } }]
    } else if (widget.type === 'chart_line') {
      option.series = [{ type: 'line', data: yData, smooth: true, areaStyle: { color: '#10B981', opacity: 0.1 }, lineStyle: { color: '#10B981', width: 3 }, symbolSize: 8, itemStyle: { color: '#10B981' } }]
    } else if (widget.type === 'chart_pie') {
      option.xAxis = { show: false }
      option.yAxis = { show: false }
      option.tooltip = { trigger: 'item', confine: true }
      option.series = [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: data.map((d: any) => ({ name: d.x_val, value: d.y_val }))
      }]
    } else if (widget.type === 'chart_scatter') {
      option.xAxis = { type: 'value', axisLine: { lineStyle: { color: '#94a3b8' } } }
      option.series = [{ type: 'scatter', symbolSize: 12, data: data.map((d: any) => [d.x_val, d.y_val]), itemStyle: { color: '#10B981' } }]
    }

    return (
      <div className="w-full h-full p-2">
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }} 
          opts={{ renderer: 'svg' }}
        />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-slate-400">
      Unsupported Widget Type
    </div>
  )
}

function DatabaseIcon({ type }: { type: string }) {
  if (type === 'kpi') return <Activity className="w-12 h-12 opacity-30 text-emerald-500" />
  if (type === 'chart_bar') return <BarChart3 className="w-12 h-12 opacity-30 text-emerald-500" />
  if (type === 'chart_line') return <LineChart className="w-12 h-12 opacity-30 text-indigo-500" />
  if (type === 'chart_pie') return <PieChart className="w-12 h-12 opacity-30 text-amber-500" />
  return <FileText className="w-12 h-12 opacity-30" />
}
