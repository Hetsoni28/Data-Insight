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

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 shadow-sm">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> Data Analytics Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Analyst Charts
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Build dynamic visual charts directly over authorized DuckDB datasets.
          </p>
        </div>

        <button 
          onClick={onCreateNew}
          className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Chart
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>Saved Visualizations</span>
          <span className="text-xs font-bold text-slate-400">({charts.length})</span>
        </h2>
        <div className="relative w-72 max-w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search saved charts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-slate-900 dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-4 text-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Loading authorized charts...</p>
        </div>
      ) : charts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <BarChart className="w-8 h-8 text-emerald-500 opacity-60" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200 mb-1">No Charts Created Yet</h3>
          <p className="text-xs font-medium max-w-sm text-slate-500 dark:text-slate-400 mb-6">
            Get started by creating your first interactive chart from your connected data sources.
          </p>
          <button 
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all"
          >
            Create your first chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {charts.map((chart) => (
            <div 
              key={chart.id}
              className="group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-200/50 dark:border-slate-700/50">
                      {chart.chart_type}
                    </span>
                    {chart.visibility === 'workspace' && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-500/20">
                        Workspace
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => onEditChart(chart.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    title="Edit Chart"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white truncate mb-1">
                  {chart.name}
                </h3>

                {chart.description ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {chart.description}
                  </p>
                ) : (
                  <p className="text-xs italic text-slate-400 dark:text-slate-600 mb-4">
                    No description provided
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  {formatDistanceToNow(new Date(chart.updated_at), { addSuffix: true })}
                </span>
                <button 
                  onClick={() => deleteMutation.mutate(chart.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Chart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
