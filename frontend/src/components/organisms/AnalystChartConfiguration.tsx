"use client"

import React, { useEffect, useState } from "react"
import { Database, Filter, Layers, Layout, Plus, Search, Settings2, Trash2, BarChart3, TrendingUp, AreaChart, PieChart } from "lucide-react"
import { ChartBase } from "@/lib/services/chart.service"
import { useQuery } from "@tanstack/react-query"
import { DatasetService } from "@/lib/dataset.service"

interface AnalystChartConfigurationProps {
  config: Partial<ChartBase>
  setConfig: React.Dispatch<React.SetStateAction<Partial<ChartBase>>>
  datasets: any[]
}

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Chart', icon: TrendingUp },
  { id: 'area', label: 'Area Chart', icon: AreaChart },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
]

const AGGREGATIONS = [
  { id: 'sum', label: 'Sum' },
  { id: 'avg', label: 'Average' },
  { id: 'count', label: 'Count' },
  { id: 'min', label: 'Minimum' },
  { id: 'max', label: 'Maximum' },
]

export function AnalystChartConfiguration({ config, setConfig, datasets }: AnalystChartConfigurationProps) {
  
  // Fetch real schema when a dataset is selected
  const { data: dataset, isLoading: isLoadingSchema } = useQuery({
    queryKey: ['dataset-profile', config.dataset_id],
    queryFn: () => DatasetService.get(config.dataset_id!),
    enabled: !!config.dataset_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.dataset_id),
  })

  // Group columns by type
  const columns = dataset?.profile?.columns 
    ? Object.entries(dataset.profile.columns).map(([k, v]: [string, any]) => ({
        name: k,
        type: v.dtype || 'unknown'
      }))
    : []

  const numericKeywords = ['int', 'float', 'double', 'decimal', 'numeric', 'number', 'real', 'bigint', 'smallint'];
  const numericColumns = columns.filter((c: any) => 
    numericKeywords.some(keyword => c.type.toLowerCase().includes(keyword))
  )
  const allColumns = columns

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      configuration_json: {
        ...prev.configuration_json,
        [key]: value
      }
    }))
  }

  return (
    <div className="flex flex-col h-full w-full divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs">
      {/* Data Source Section */}
      <div className="p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
            Data Source
          </h3>
        </div>
        
        <div className="relative">
          <select
            value={config.dataset_id || ''}
            onChange={(e) => setConfig({ ...config, dataset_id: e.target.value })}
            className="w-full p-3 pr-9 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
          >
            <option value="" disabled>Select Authorized Dataset</option>
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Type Section */}
      <div className="p-5 space-y-3.5">
        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Layout className="w-3.5 h-3.5" />
          </div>
          Chart Visual Type
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {CHART_TYPES.map(t => {
            const isSelected = config.chart_type === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setConfig({ ...config, chart_type: t.id })}
                className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 group relative overflow-hidden ${
                  isSelected 
                    ? 'bg-gradient-to-b from-emerald-50 to-teal-50/60 dark:from-emerald-950/50 dark:to-teal-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-500/10 font-bold' 
                    : 'bg-white dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Data Mapping Section */}
      <div className="p-5 space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            Data Mapping
          </h3>
          {columns.length > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">
              {columns.length} Cols
            </span>
          )}
        </div>

        {!config.dataset_id ? (
          <div className="text-center py-10 px-4 text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Filter className="w-5 h-5" />
            </div>
            <span className="max-w-[200px] leading-relaxed">Select a dataset above to configure chart axes & fields</span>
          </div>
        ) : isLoadingSchema ? (
          <div className="text-center py-10 text-emerald-500 text-xs font-bold flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span>Parsing Schema...</span>
          </div>
        ) : (
          <div className="space-y-4.5">
            {/* Dimension (X-Axis) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Dimension (X-Axis)
                </label>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Category</span>
              </div>
              <select
                value={config.configuration_json?.dimension || ''}
                onChange={(e) => handleConfigChange('dimension', e.target.value)}
                className="w-full p-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
              >
                <option value="" disabled>Select category column</option>
                {allColumns.map(c => (
                  <option key={c.name} value={c.name}>{c.name} {c.type ? `(${c.type})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Metric (Y-Axis) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Metric (Y-Axis)
                </label>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Numeric</span>
              </div>
              <select
                value={config.configuration_json?.metric || ''}
                onChange={(e) => handleConfigChange('metric', e.target.value)}
                className="w-full p-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
              >
                <option value="" disabled>Select numeric value column</option>
                {numericColumns.map(c => (
                  <option key={c.name} value={c.name}>{c.name} {c.dtype ? `[${c.dtype}]` : ''}</option>
                ))}
              </select>
            </div>

            {/* Aggregation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Aggregation Function
              </label>
              <select
                value={config.configuration_json?.aggregation || 'sum'}
                onChange={(e) => handleConfigChange('aggregation', e.target.value)}
                className="w-full p-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
              >
                {AGGREGATIONS.map(a => (
                  <option key={a.id} value={a.id}>{a.label} ({a.id.toUpperCase()})</option>
                ))}
              </select>
            </div>
            
            {/* Limits */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Result Display Limit
              </label>
              <select
                value={config.configuration_json?.limit || 100}
                onChange={(e) => handleConfigChange('limit', parseInt(e.target.value))}
                className="w-full p-2.5 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
              >
                <option value={10}>Top 10 items</option>
                <option value={20}>Top 20 items</option>
                <option value={50}>Top 50 items</option>
                <option value={100}>Top 100 items</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
