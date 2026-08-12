"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ChartService } from "@/lib/services/chart.service"
import { BarChart2, Search, Plus, Loader2, Sparkles, MoreHorizontal, Trash2, Edit2, Copy, BarChart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface AnalystChartsHubProps {
  onCreateNew: () => void
  onEditChart: (id: string) => void
}

export function AnalystChartsHub({ onCreateNew, onEditChart }: AnalystChartsHubProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-charts', searchQuery],
    queryFn: () => ChartService.getCharts({ search: searchQuery }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ChartService.deleteChart(id),
    onSuccess: () => {
      toast.success("Chart deleted securely")
      queryClient.invalidateQueries({ queryKey: ['tenant-charts'] })
    },
    onError: () => toast.error("Failed to delete chart")
  })

  const charts = data?.items || []

  const [selectedType, setSelectedType] = useState<string>("all")

  const filteredCharts = charts.filter((c: any) => {
    if (selectedType !== "all" && c.chart_type !== selectedType) return false
    return true
  })

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Analyst Visualizations
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Create, manage, and explore high-performance interactive charts computed directly on your authorized tenant datasets.
          </p>
        </div>

        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:shadow-xl hover:shadow-emerald-500/25 active:scale-95 transition-all shadow-md shadow-emerald-500/20 border border-emerald-400/30 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create New Chart
        </button>
      </div>

      {/* Quick Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Saved</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{charts.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
            <BarChart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bar Charts</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {charts.filter((c: any) => c.chart_type === 'bar').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Area & Line</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {charts.filter((c: any) => c.chart_type === 'line' || c.chart_type === 'area').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pie Charts</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {charts.filter((c: any) => c.chart_type === 'pie').length}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'bar', label: 'Bar' },
            { id: 'line', label: 'Line' },
            { id: 'area', label: 'Area' },
            { id: 'pie', label: 'Pie' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${
                selectedType === t.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search chart title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading saved charts...</p>
        </div>
      ) : filteredCharts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/40 p-8 text-center shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-sm">
            <BarChart className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1 tracking-tight">No Charts Found</h3>
          <p className="text-xs font-medium max-w-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {searchQuery ? 'No charts match your search query. Try clearing filters.' : 'Get started by creating your first interactive visualization from your connected data.'}
          </p>
          <button 
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            Create Your First Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCharts.map((chart: any) => (
            <div 
              key={chart.id}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider border border-slate-200/60 dark:border-slate-700/60">
                      {chart.chart_type}
                    </span>
                    {chart.visibility === 'workspace' && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-500/20">
                        Workspace
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => onEditChart(chart.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    title="Edit Chart"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white truncate mb-1.5 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {chart.name}
                </h3>

                {chart.description ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                    {chart.description}
                  </p>
                ) : (
                  <p className="text-xs italic text-slate-400 dark:text-slate-600 mb-5">
                    No description provided
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Updated {formatDistanceToNow(new Date(chart.updated_at), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditChart(chart.id)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-[11px] font-bold transition-all"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteMutation.mutate(chart.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Chart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
