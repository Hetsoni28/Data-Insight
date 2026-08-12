"use client"

import React from "react"
import { useBuilderStore } from "@/store/useBuilderStore"
import { Settings2, Database, Sliders, Type as TypeIcon, BarChart, Hash, Layers, CheckCircle2, ChevronRight } from "lucide-react"
import { DatasetService } from "@/lib/services/dataset.service"
import { useQuery } from "@tanstack/react-query"

export function AnalystBuilderProperties() {
  const { layout, selectedWidgetId, updateWidget } = useBuilderStore()
  
  const selectedWidget = layout.widgets.find(w => w.id === selectedWidgetId)

  // Fetch available datasets for the user
  const { data: datasets } = useQuery({
    queryKey: ['available-datasets'],
    queryFn: () => DatasetService.getDatasets()
  })

  // Fetch profile for the selected dataset to get columns
  const selectedDatasetId = selectedWidget?.config?.dataset_id
  const { data: datasetProfile } = useQuery({
    queryKey: ['dataset-profile', selectedDatasetId],
    queryFn: () => DatasetService.getDatasetProfile(selectedDatasetId),
    enabled: !!selectedDatasetId
  })

  if (!selectedWidget) {
    return (
      <div className="w-80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 z-10 select-none">
        <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            Widget Inspector
          </h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-4 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <Settings2 className="w-8 h-8 text-slate-400 dark:text-slate-600 animate-spin-slow" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No Selection</h3>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
            Click any widget on the canvas to configure data fields, titles, and metrics.
          </p>
        </div>
      </div>
    )
  }

  const columns = datasetProfile?.profile?.columns 
    ? Object.keys(datasetProfile.profile.columns)
    : []

  const updateConfig = (key: string, value: any) => {
    updateWidget(selectedWidget.id, {
      config: {
        ...selectedWidget.config,
        [key]: value
      }
    })
  }

  return (
    <div className="w-80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 z-10 overflow-y-auto custom-scrollbar select-none">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-900 sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg shrink-0">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
              Widget Properties
            </h2>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate capitalize">
              {selectedWidget.type.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-6">
        {/* General Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <TypeIcon className="w-3.5 h-3.5 text-emerald-500" />
            General Settings
          </h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Widget Title
            </label>
            <input 
              type="text" 
              value={selectedWidget.title}
              onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-all"
              placeholder="Enter widget title..."
            />
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-900" />

        {/* Data Configuration */}
        {selectedWidget.type !== 'markdown' && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Data Source & Fields
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dataset Connection
                </label>
                <select
                  value={selectedWidget.config.dataset_id || ''}
                  onChange={(e) => updateConfig('dataset_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-all cursor-pointer"
                >
                  <option value="">Select a dataset...</option>
                  {datasets?.map((ds: any) => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
              </div>

              {selectedWidget.config.dataset_id && (
                <div className="space-y-4 p-4 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                  {selectedWidget.type !== 'kpi' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        Dimension (Category)
                      </label>
                      <select
                        value={selectedWidget.config.dimension || selectedWidget.config.xAxis || ''}
                        onChange={(e) => updateConfig('dimension', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="">Select category column...</option>
                        {columns.map((col) => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-emerald-500" />
                      Metric (Value Column)
                    </label>
                    <select
                      value={selectedWidget.config.metric || selectedWidget.config.yAxis || ''}
                      onChange={(e) => updateConfig('metric', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="">Select numeric metric...</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <BarChart className="w-3.5 h-3.5 text-amber-500" />
                      Aggregation Function
                    </label>
                    <select
                      value={selectedWidget.config.aggregation || 'SUM'}
                      onChange={(e) => updateConfig('aggregation', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="SUM">Sum (SUM)</option>
                      <option value="AVG">Average (AVG)</option>
                      <option value="MIN">Minimum (MIN)</option>
                      <option value="MAX">Maximum (MAX)</option>
                      <option value="COUNT">Row Count (COUNT)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedWidget.type === 'markdown' && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TypeIcon className="w-3.5 h-3.5 text-emerald-500" />
              Markdown Content
            </h3>
            <textarea
              value={selectedWidget.config.text || ''}
              onChange={(e) => updateConfig('text', e.target.value)}
              className="w-full h-40 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white resize-none transition-all leading-relaxed"
              placeholder="Enter markdown text here..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
