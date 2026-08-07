"use client"

import React, { useEffect, useState } from "react"
import { useBuilderStore } from "@/store/useBuilderStore"
import { Settings, Trash2, Database, LayoutTemplate } from "lucide-react"
import api from "@/lib/api"

export function DashboardBuilderProperties() {
  const { layout, selectedWidgetId, updateWidget, removeWidget } = useBuilderStore()
  const [datasets, setDatasets] = useState<any[]>([])

  useEffect(() => {
    api.get('/tenant-datasets').then(res => {
      setDatasets(res.data?.data || [])
    }).catch(console.error)
  }, [])
  
  const selectedWidget = layout.widgets.find(w => w.id === selectedWidgetId)

  if (!selectedWidget) {
    return (
      <div className="w-80 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex flex-col h-full shrink-0">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">No Widget Selected</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click on a widget in the canvas to configure its properties, data sources, and appearance.
          </p>
        </div>
      </div>
    )
  }

  const handleChange = (key: string, value: any) => {
    updateWidget(selectedWidget.id, { [key]: value })
  }

  const handleConfigChange = (key: string, value: any) => {
    updateWidget(selectedWidget.id, { 
      config: { ...selectedWidget.config, [key]: value } 
    })
  }

  return (
    <div className="w-80 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center">
          <Settings className="w-4 h-4 mr-2 text-slate-500" />
          Properties
        </h2>
        <button 
          onClick={() => removeWidget(selectedWidget.id)}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete Widget"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <LayoutTemplate className="w-3 h-3 mr-1" /> General
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input 
              type="text" 
              value={selectedWidget.title} 
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Width (cols)</label>
              <input 
                type="number" 
                min={1} max={12}
                value={selectedWidget.w} 
                onChange={(e) => handleChange('w', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Height (rows)</label>
              <input 
                type="number" 
                min={1} max={12}
                value={selectedWidget.h} 
                onChange={(e) => handleChange('h', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-white/10" />

        {/* Data Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <Database className="w-3 h-3 mr-1" /> Data Source
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dataset Source</label>
            <select
              value={selectedWidget.config?.dataset_id || ''} 
              onChange={(e) => handleConfigChange('dataset_id', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a Dataset...</option>
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {['chart_bar', 'chart_line', 'chart_pie', 'chart_scatter', 'data_table', 'kpi'].includes(selectedWidget.type) ? (
            <>
              {selectedWidget.type !== 'kpi' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">X-Axis Column</label>
                  <input 
                    type="text" 
                    value={selectedWidget.config?.xAxis || ''} 
                    onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{selectedWidget.type === 'kpi' ? 'Metric Column (to sum)' : 'Y-Axis Column'}</label>
                <input 
                  type="text" 
                  value={selectedWidget.config?.yAxis || ''} 
                  onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          ) : null}

          {selectedWidget.type === 'ai_insight' || selectedWidget.type === 'markdown' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
              <textarea 
                rows={5}
                value={selectedWidget.config?.text || ''} 
                onChange={(e) => handleConfigChange('text', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
