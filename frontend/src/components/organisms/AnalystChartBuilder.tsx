"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Save, Loader2, Sparkles, Database, BarChart2 } from "lucide-react"
import { ChartService, ChartBase } from "@/lib/services/chart.service"
import { DatasetService } from "@/lib/dataset.service"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const AnalystChartPreview = dynamic(
  () => import("./AnalystChartPreview").then((mod) => mod.AnalystChartPreview),
  { ssr: false }
)
import { AnalystChartConfiguration } from "./AnalystChartConfiguration"

interface AnalystChartBuilderProps {
  chartId: string | null
  onBack: () => void
}

export function AnalystChartBuilder({ chartId, onBack }: AnalystChartBuilderProps) {
  const queryClient = useQueryClient()
  
  // Local state for the chart being built
  const [config, setConfig] = useState<Partial<ChartBase>>({
    name: "Untitled Chart",
    description: "",
    chart_type: "bar",
    visibility: "private",
    configuration_json: {
      dimension: "",
      metric: "",
      aggregation: "sum",
      filters: [],
      limit: 100
    }
  })

  const isEditing = !!chartId

  // Fetch existing chart if editing
  const { data: existingChart, isLoading: isLoadingChart } = useQuery({
    queryKey: ['tenant-chart', chartId],
    queryFn: () => ChartService.getChart(chartId!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (existingChart) {
      setConfig({
        name: existingChart.name,
        description: existingChart.description,
        chart_type: existingChart.chart_type,
        dataset_id: existingChart.dataset_id,
        visibility: existingChart.visibility,
        configuration_json: existingChart.configuration_json || {}
      })
    }
  }, [existingChart])

  // Fetch authorized datasets for the selector
  const { data: datasetsRes } = useQuery({
    queryKey: ['tenant-datasets'],
    queryFn: () => DatasetService.getDatasets(),
  })
  const datasets = Array.isArray(datasetsRes) ? datasetsRes : ((datasetsRes as any)?.data || [])

  const saveMutation = useMutation({
    mutationFn: (data: ChartBase) => 
      isEditing ? ChartService.updateChart(chartId, data) : ChartService.createChart(data),
    onSuccess: () => {
      toast.success(isEditing ? "Chart updated successfully" : "Chart saved successfully")
      queryClient.invalidateQueries({ queryKey: ['tenant-charts'] })
      onBack()
    },
    onError: () => toast.error("Failed to save chart")
  })

  const handleSave = () => {
    if (!config.dataset_id || !config.name || !config.configuration_json?.dimension || !config.configuration_json?.metric) {
      toast.error("Please select a dataset, dimension, and metric to save.")
      return
    }
    saveMutation.mutate(config as ChartBase)
  }

  if (isEditing && isLoadingChart) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-white dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading chart...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/80 transition-colors">
      {/* Premium Enterprise Header */}
      <div className="h-16 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-95 group flex items-center gap-1.5"
            title="Back to Visualizations Hub"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs font-bold hidden sm:inline-block">Hub</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/20 dark:to-teal-400/10 border border-emerald-500/30 flex items-center justify-center shadow-inner shrink-0">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Chart Title..."
                  className="text-base font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-all p-0 placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-tight"
                />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  {isEditing ? 'Editing Chart' : 'Draft Chart'}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Analyst Studio / {config.chart_type?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isEditing ? 'Update Chart' : 'Save Chart'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Configuration */}
        <div className="w-80 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col z-10">
          <AnalystChartConfiguration 
            config={config} 
            setConfig={setConfig} 
            datasets={datasets} 
          />
        </div>

        {/* Main Panel: Preview */}
        <div className="flex-1 bg-slate-100/60 dark:bg-slate-950/90 p-5 md:p-8 overflow-y-auto custom-scrollbar flex flex-col relative">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col relative z-0">
            <AnalystChartPreview config={config} />
          </div>
        </div>
      </div>
    </div>
  )
}
