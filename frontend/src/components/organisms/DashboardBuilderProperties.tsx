"use client"

import React, { useEffect, useState } from "react"
import { useBuilderStore } from "@/store/useBuilderStore"
import { Settings, Trash2, Database, LayoutTemplate } from "lucide-react"
import api from "@/lib/api"

export function DashboardBuilderProperties() {
  const { layout, selectedWidgetId, updateWidget, removeWidget } = useBuilderStore()
  const [datasets, setDatasets] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loadingCols, setLoadingCols] = useState(false)

  const selectedWidget = layout.widgets.find(w => w.id === selectedWidgetId)

  useEffect(() => {
    api.get('/tenant-datasets').then(res => {
      setDatasets(res.data?.data || [])
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedWidget?.config?.dataset_id) {
      setLoadingCols(true)
      api.get(`/tenant-datasets/${selectedWidget.config.dataset_id}`)
        .then(res => {
          const profile = res.data?.data?.profile;
          if (profile && typeof profile === 'object' && profile.columns) {
            setColumns(Object.keys(profile.columns));
          } else {
            setColumns([]);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCols(false))
    } else {
      setColumns([])
    }
  }, [selectedWidget?.config?.dataset_id])
  
  if (!selectedWidget) {
    return (
      <div className="w-80 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F17] flex flex-col h-full shrink-0">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
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
    <div className="w-80 border-l border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F17] flex flex-col h-full shrink-0 relative">
      <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-emerald-500" />
          Properties
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-24">
        {/* General Settings */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center">
            <LayoutTemplate className="w-4 h-4 mr-2 opacity-70" /> General
          </h3>
          
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Widget Title</label>
            <input 
              type="text" 
              value={selectedWidget.title} 
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Width (1-12)</label>
              <input 
                type="number" 
                min={1} max={12}
                value={selectedWidget.w} 
                onChange={(e) => handleChange('w', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Height (rows)</label>
              <input 
                type="number" 
                min={1} max={12}
                value={selectedWidget.h} 
                onChange={(e) => handleChange('h', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100 dark:border-white/5" />

        {/* Data Settings */}
        <div className="space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center">
            <Database className="w-4 h-4 mr-2 opacity-70" /> Data Source
          </h3>
          
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Bind Dataset</label>
            <select
              value={selectedWidget.config?.dataset_id || ''} 
              onChange={(e) => handleConfigChange('dataset_id', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
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
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between">
                    X-Axis Category
                    {loadingCols && <span className="text-[10px] text-emerald-500 font-bold uppercase animate-pulse">Syncing...</span>}
                  </label>
                  {columns.length > 0 ? (
                    <select
                      value={selectedWidget.config?.xAxis || ''} 
                      onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                    >
                      <option value="">Select Column...</option>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Type column name"
                      value={selectedWidget.config?.xAxis || ''} 
                      onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                    />
                  )}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between">
                  {selectedWidget.type === 'kpi' ? 'Metric Value' : 'Y-Axis Value'}
                  {loadingCols && <span className="text-[10px] text-emerald-500 font-bold uppercase animate-pulse">Syncing...</span>}
                </label>
                {columns.length > 0 ? (
                  <select
                    value={selectedWidget.config?.yAxis || ''} 
                    onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                  >
                    <option value="">Select Column...</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Type column name"
                    value={selectedWidget.config?.yAxis || ''} 
                    onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
                  />
                )}
              </div>
            </>
          ) : null}

          {selectedWidget.type === 'ai_insight' || selectedWidget.type === 'markdown' ? (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Content (Markdown)</label>
              <textarea 
                rows={10}
                value={selectedWidget.config?.text || ''} 
                onChange={(e) => handleConfigChange('text', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner font-mono resize-y"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky Destructive Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#0B0F17] border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => removeWidget(selectedWidget.id)}
          className="w-full flex items-center justify-center px-4 py-2.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl text-sm font-semibold transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Widget
        </button>
      </div>
    </div>
  )
}
