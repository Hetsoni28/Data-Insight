import React, { useState } from "react"
import { Loader2, Sparkles, AlertTriangle } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { TrendForecastViewer } from "./TrendForecastViewer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"

export function AIForecastTab({ datasetId, schema }: { datasetId: string, schema: any[] }) {
  const [dateCol, setDateCol] = useState<string>("")
  const [metricCol, setMetricCol] = useState<string>("")
  const [horizon, setHorizon] = useState("6")
  const [loading, setLoading] = useState(false)
  const [forecastResult, setForecastResult] = useState<any>(null)

  const dateCandidates = schema?.filter(col => 
    col.data_type?.toLowerCase().includes("date") || 
    col.data_type?.toLowerCase().includes("time") ||
    col.name.toLowerCase().includes("date") ||
    col.name.toLowerCase().includes("time")
  ) || []

  const numericCandidates = schema?.filter(col => 
    col.data_type?.toLowerCase().includes("int") || 
    col.data_type?.toLowerCase().includes("float") ||
    col.data_type?.toLowerCase().includes("numeric") ||
    col.data_type?.toLowerCase().includes("double")
  ) || []

  const runForecast = async () => {
    if (!metricCol) {
      toast.error("Please select a target metric column to forecast.")
      return
    }

    try {
      setLoading(true)
      const dateVal = dateCol === "auto" || !dateCol ? null : dateCol
      const res = await api.post(`/ai/forecast`, {
        dataset_id: datasetId,
        date_column: dateVal,
        target_column: metricCol,
        horizon: parseInt(horizon)
      })
      // The backend returns the blueprint directly. TrendForecastViewer expects { ai_blueprint: ... }
      setForecastResult({ ai_blueprint: res.data })
      toast.success("Forecast generated successfully!")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to generate forecast.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Time-Series Forecasting</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Select a date column and a numeric metric to predict future trends using Facebook Prophet and Ridge Regression.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Date/Time Column (Optional)</label>
            <Select value={dateCol} onValueChange={setDateCol}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Auto-detect or select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {dateCandidates.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Target Metric (Required)</label>
            <Select value={metricCol} onValueChange={setMetricCol}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select metric to predict" />
              </SelectTrigger>
              <SelectContent>
                {numericCandidates.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Forecast Horizon</label>
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Periods</SelectItem>
                <SelectItem value="6">6 Periods</SelectItem>
                <SelectItem value="12">12 Periods</SelectItem>
                <SelectItem value="24">24 Periods</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={runForecast} 
          disabled={loading || !metricCol}
          className="w-full sm:w-auto px-8 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
          Run AI Forecast
        </Button>
      </div>

      {forecastResult && (
        <TrendForecastViewer report={forecastResult} />
      )}
    </div>
  )
}
