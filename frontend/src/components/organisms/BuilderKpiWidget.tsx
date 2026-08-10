"use client"

import React from "react"
import { Activity } from "lucide-react"

interface BuilderKpiWidgetProps {
  widget: any
  data: any
}

export function BuilderKpiWidget({ widget, data }: BuilderKpiWidgetProps) {
  const val = data && data.length > 0 ? data[0].y_val : 0

  return (
    <div className="flex-1 flex flex-col justify-center px-6 h-full">
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
