"use client"

import React from "react"
import { useDraggable } from "@dnd-kit/core"
import { BarChart3, LineChart, PieChart, Activity, FileText, Type, Sparkles, GripVertical } from "lucide-react"

export const WIDGET_TEMPLATES = [
  { type: 'kpi', title: 'KPI Metric', icon: Activity, description: 'Single metric card' },
  { type: 'chart_bar', title: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { type: 'chart_line', title: 'Line Chart', icon: LineChart, description: 'Trend over time' },
  { type: 'chart_pie', title: 'Pie Chart', icon: PieChart, description: 'Part to whole' },
  { type: 'data_table', title: 'Data Table', icon: FileText, description: 'Raw paginated data' },
  { type: 'ai_insight', title: 'AI Insight', icon: Sparkles, description: 'Auto-generated analysis' },
  { type: 'markdown', title: 'Rich Text', icon: Type, description: 'Markdown notes' }
]

function DraggableWidgetTemplate({ widget }: { widget: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${widget.type}`,
    data: {
      type: widget.type,
      title: widget.title,
      isTemplate: true
    }
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col p-4 mb-3 border rounded-xl bg-white dark:bg-slate-900 cursor-grab active:cursor-grabbing hover:border-emerald-500 hover:shadow-sm transition-all group ${
        isDragging ? 'opacity-50 border-emerald-500 shadow-md' : 'border-slate-200 dark:border-white/10'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
          <widget.icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{widget.title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{widget.description}</p>
        </div>
        <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

export function DashboardBuilderSidebar() {
  return (
    <div className="w-72 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-white/10">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center">
          Widget Library
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag widgets to the canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {WIDGET_TEMPLATES.map(widget => (
          <DraggableWidgetTemplate key={widget.type} widget={widget} />
        ))}
      </div>
    </div>
  )
}
