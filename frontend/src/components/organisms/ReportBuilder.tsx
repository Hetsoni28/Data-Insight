"use client"

import { useState } from "react"
import { Database, LayoutTemplate, Save, Loader2, Sparkles, Plus, Trash2 } from "lucide-react"

export function ReportBuilder({ onSave }: { onSave: (config: any) => Promise<void> }) {
  const [dimensions, setDimensions] = useState<string[]>([""])
  const [metrics, setMetrics] = useState<any[]>([{ field: "", aggregation: "sum" }])
  const [datasetId, setDatasetId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave({
      dataset_id: datasetId,
      dimensions: dimensions.filter(d => d.trim()),
      metrics: metrics.filter(m => m.field.trim())
    })
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20"><LayoutTemplate className="w-5 h-5 text-indigo-500" /></div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">Custom Report Builder</h2>
          <p className="text-xs text-slate-500">Configure dimensions and metrics visually without SQL</p>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Source Dataset ID</label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={datasetId} 
              onChange={e => setDatasetId(e.target.value)} 
              placeholder="UUID of the dataset..." 
              className="w-full text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
            />
          </div>
        </div>
        
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            Dimensions
            <button onClick={() => setDimensions([...dimensions, ""])} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"><Plus className="w-3 h-3" /> Add Dimension</button>
          </label>
          <div className="space-y-3">
            {dimensions.map((dim, i) => (
              <div key={i} className="flex gap-2 items-center group">
                <input 
                  value={dim} 
                  onChange={e => { const n = [...dimensions]; n[i] = e.target.value; setDimensions(n) }} 
                  placeholder="e.g. region" 
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                />
                <button onClick={() => setDimensions(dimensions.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            Metrics
            <button onClick={() => setMetrics([...metrics, { field: "", aggregation: "sum" }])} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"><Plus className="w-3 h-3" /> Add Metric</button>
          </label>
          <div className="space-y-3">
            {metrics.map((met, i) => (
              <div key={i} className="flex gap-2 items-center group">
                <input 
                  value={met.field} 
                  onChange={e => { const n = [...metrics]; n[i].field = e.target.value; setMetrics(n) }} 
                  placeholder="e.g. revenue" 
                  className="flex-1 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                />
                <select 
                  value={met.aggregation} 
                  onChange={e => { const n = [...metrics]; n[i].aggregation = e.target.value; setMetrics(n) }} 
                  className="w-32 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                >
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                </select>
                <button onClick={() => setMetrics(metrics.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button onClick={handleSave} disabled={loading || !datasetId} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Build Report Query
          </button>
        </div>
      </div>
    </div>
  )
}
