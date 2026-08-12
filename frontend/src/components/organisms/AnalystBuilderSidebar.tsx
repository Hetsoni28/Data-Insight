"use client"

import React from "react"
import { useDraggable } from "@dnd-kit/core"
import { BarChart3, LineChart, PieChart, Table, Type, LayoutDashboard, BrainCircuit, GripVertical, Sparkles, ScatterChart } from "lucide-react"

const WIDGET_TEMPLATES = [
  { type: 'kpi', title: 'KPI Scorecard', category: 'Metrics', desc: 'Single aggregated metric with trend', icon: <LayoutDashboard className="w-5 h-5 text-emerald-500" />, badge: 'Metric' },
  { type: 'chart_bar', title: 'Bar Chart', category: 'Charts', desc: 'Category breakdown & comparisons', icon: <BarChart3 className="w-5 h-5 text-sky-500" />, badge: 'Chart' },
  { type: 'chart_line', title: 'Line Chart', category: 'Charts', desc: 'Time series & trend tracking', icon: <LineChart className="w-5 h-5 text-indigo-500" />, badge: 'Chart' },
  { type: 'chart_pie', title: 'Pie Chart', category: 'Charts', desc: 'Proportional slice analysis', icon: <PieChart className="w-5 h-5 text-amber-500" />, badge: 'Chart' },
  { type: 'data_table', title: 'Data Table', category: 'Tables', desc: 'Structured aggregated data list', icon: <Table className="w-5 h-5 text-emerald-400" />, badge: 'Table' },
  { type: 'ai_insight', title: 'AI Insight', category: 'AI & Content', desc: 'LLM generated markdown commentary', icon: <BrainCircuit className="w-5 h-5 text-purple-400" />, badge: 'AI' },
  { type: 'markdown', title: 'Text Block', category: 'AI & Content', desc: 'Custom formatted markdown text', icon: <Type className="w-5 h-5 text-slate-400" />, badge: 'Text' },
]

function DraggableWidget({ template }: { template: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.type}`,
    data: {
      isTemplate: true,
      ...template
    }
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group relative flex items-center gap-3 p-3 bg-white dark:bg-slate-900/90 border rounded-2xl cursor-grab transition-all duration-200 ${
        isDragging 
          ? 'opacity-50 border-emerald-500 shadow-2xl scale-105 z-50 ring-2 ring-emerald-500/20' 
          : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:bg-slate-900'
      }`}
    >
      <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl group-hover:scale-110 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all shrink-0">
        {template.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {template.title}
          </h4>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight">
          {template.desc}
        </p>
      </div>
      <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  )
}

export function AnalystBuilderSidebar() {
  return (
    <div className="w-72 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 z-10 relative select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Widget Components
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            Drag elements onto canvas
          </p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full">
          {WIDGET_TEMPLATES.length} Items
        </span>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <div className="space-y-2">
          {WIDGET_TEMPLATES.map((template) => (
            <DraggableWidget key={template.type} template={template} />
          ))}
        </div>
      </div>

      {/* Helper Footer */}
      <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-500/20 text-center">
        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          💡 Quick Tip
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
          Click any widget on the canvas to configure dataset metrics & columns.
        </p>
      </div>
    </div>
  )
}
