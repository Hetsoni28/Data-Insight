"use client"

import React, { useEffect, useState } from "react"
import api from "@/lib/api"
import { Activity, BarChart3, FileText, LineChart, PieChart, AlertCircle } from "lucide-react"
import { BuilderKpiWidget } from "./BuilderKpiWidget"
import { BuilderChartWidget } from "./BuilderChartWidget"
import { BuilderAiInsightWidget } from "./BuilderAiInsightWidget"
import { BuilderDataTableWidget } from "./BuilderDataTableWidget"

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
        sql = `SELECT COALESCE(SUM(TRY_CAST("${yCol}" AS DOUBLE)), COUNT("${yCol}")) as y_val FROM dataset`
      } else if (widget.type === 'chart_scatter') {
        const boundsSql = `SELECT MIN(TRY_CAST("${xCol}" AS DOUBLE)) as min_x, MAX(TRY_CAST("${xCol}" AS DOUBLE)) as max_x, MIN(TRY_CAST("${yCol}" AS DOUBLE)) as min_y, MAX(TRY_CAST("${yCol}" AS DOUBLE)) as max_y FROM dataset`
        const boundsRes = await api.post(`/datasets/${widget.config.dataset_id}/query`, { sql: boundsSql, limit: 1, offset: 0 })
        const boundsData = boundsRes.data?.data?.rows || boundsRes.data?.rows || []
        
        let minX = 0, maxX = 100, minY = 0, maxY = 100;
        if (boundsData.length > 0) {
           minX = boundsData[0][0] ?? 0;
           maxX = boundsData[0][1] ?? 100;
           minY = boundsData[0][2] ?? 0;
           maxY = boundsData[0][3] ?? 100;
        }
        
        if (maxX === minX) maxX = minX + 1;
        if (maxY === minY) maxY = minY + 1;
        
        const binX = (maxX - minX) / 20;
        const binY = (maxY - minY) / 20;
        
        sql = `SELECT ROUND(TRY_CAST("${xCol}" AS DOUBLE) / ${binX}) * ${binX} as x_val, ROUND(TRY_CAST("${yCol}" AS DOUBLE) / ${binY}) * ${binY} as y_val, COUNT(*) as density FROM dataset WHERE TRY_CAST("${xCol}" AS DOUBLE) IS NOT NULL AND TRY_CAST("${yCol}" AS DOUBLE) IS NOT NULL GROUP BY 1, 2 LIMIT 1000`
      } else if (widget.type === 'data_table') {
        sql = `SELECT "${xCol}" as x_val, "${yCol}" as y_val FROM dataset LIMIT 50`
      } else {
        sql = `SELECT "${xCol}" as x_val, COALESCE(SUM(TRY_CAST("${yCol}" AS DOUBLE)), COUNT("${yCol}")) as y_val FROM dataset GROUP BY "${xCol}" ORDER BY y_val DESC LIMIT 15`
      }

      const res = await api.post(`/datasets/${widget.config.dataset_id}/query`, {
        sql: sql,
        limit: 100,
        offset: 0
      })
      
      const rawRows = res.data?.data?.rows || res.data?.rows || []
      const cols = res.data?.data?.columns || res.data?.columns || []
      
      const mappedData = rawRows.map((row: any[]) => {
        const obj: any = {}
        cols.forEach((col: string, i: number) => {
          let val = row[i];
          if (typeof val === 'number' && !Number.isInteger(val)) {
            val = Math.round(val * 100) / 100;
          }
          obj[col] = val
        })
        return obj
      })
      
      setData(mappedData)
    } catch (err: any) {
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
      <div className="w-full h-full p-4">
        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-white/5">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
            <DatabaseIcon type={widget.type} />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Awaiting Data</h4>
          <span className="text-xs text-slate-500 text-center max-w-[200px]">
            Select a dataset in the Properties panel to bind real data to this widget.
          </span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full p-4 flex flex-col justify-end space-y-2 animate-pulse">
        <div className="w-full h-1/2 bg-slate-200 dark:bg-white/5 rounded-lg"></div>
        <div className="w-full h-1/4 bg-slate-200 dark:bg-white/5 rounded-lg"></div>
        <div className="w-3/4 h-1/4 bg-slate-200 dark:bg-white/5 rounded-lg"></div>
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
    return <BuilderKpiWidget widget={widget} data={data} />
  }

  if (widget.type === 'ai_insight' || widget.type === 'markdown') {
    return <BuilderAiInsightWidget widget={widget} />
  }

  if (widget.type === 'data_table') {
    return <BuilderDataTableWidget widget={widget} data={data} />
  }

  if (widget.type.startsWith('chart_')) {
    return <BuilderChartWidget widget={widget} data={data} />
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-slate-400">
      Unsupported Widget Type
    </div>
  )
}

function DatabaseIcon({ type }: { type: string }) {
  const baseClasses = "w-10 h-10 relative z-10"
  if (type === 'kpi') return <Activity className={`${baseClasses} text-emerald-500`} />
  if (type === 'chart_bar') return <BarChart3 className={`${baseClasses} text-emerald-500`} />
  if (type === 'chart_line') return <LineChart className={`${baseClasses} text-emerald-500`} />
  if (type === 'chart_pie') return <PieChart className={`${baseClasses} text-emerald-500`} />
  return <FileText className={`${baseClasses} text-slate-400`} />
}
