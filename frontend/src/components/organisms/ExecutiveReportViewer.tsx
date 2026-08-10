import React from "react"
import { Brain, TrendingUp, DollarSign, Activity, AlertTriangle, Lightbulb, CheckCircle2, ShieldCheck, FileSpreadsheet, FileText, BarChart3, Target, Users, Zap, PieChart, Layers } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface ExecutiveReportViewerProps {
  report: any
  hideDownload?: boolean
}

export function ExecutiveReportViewer({ report, hideDownload = false }: ExecutiveReportViewerProps) {
  const data = report?.ai_blueprint
  if (!data) return <div className="p-8 text-center text-slate-500 font-medium">No AI Blueprint data found.</div>

  const handleDownload = async (type: 'pdf' | 'excel') => {
    toast.loading(`Preparing ${type.toUpperCase()}...`, { id: `dl-${report.id}` })
    try {
      const res = await api.get(`/tenant-reports/${report.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}_${report.id.substring(0, 8)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Download complete!", { id: `dl-${report.id}` })
    } catch (e) {
      toast.error("Failed to download report", { id: `dl-${report.id}` })
    }
  }

  // Helper: render a list of strings with bullets
  const renderList = (items: any, bulletColor = "bg-emerald-500") => {
    if (!items) return <p className="text-xs text-slate-400 italic">No data available</p>
    const arr = Array.isArray(items) ? items : [items]
    if (!arr.length) return <p className="text-xs text-slate-400 italic">No data available</p>
    return (
      <ul className="space-y-2">
        {arr.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${bulletColor}`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  // Helper: render a text block
  const renderText = (value: any) => {
    if (!value) return <p className="text-xs text-slate-400 italic">No data available</p>
    return <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{String(value)}</p>
  }

  const scores = data.confidenceScores || {}

  return (
    <div className="w-full bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4 flex items-center justify-between gap-4 border-b border-emerald-800/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Executive AI Report
          </div>
          <h2 className="text-lg font-bold text-white leading-tight truncate">{report.title}</h2>
        </div>
        {!hideDownload && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => handleDownload('pdf')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg text-xs font-semibold transition-all">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => handleDownload('excel')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg text-xs font-semibold transition-all shadow-md">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        )}
      </div>

      {/* ── CONFIDENCE SCORES strip ── */}
      {Object.keys(scores).length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 px-6 py-3 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">AI Confidence</span>
          {Object.entries(scores).map(([key, val]: any) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{val}%</span>
            </div>
          ))}
        </div>
      )}

      {/* ── BODY ── */}
      <div className="p-6 space-y-6">

        {/* Row 1: Customer Behavior + Business Trends */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 rounded-md text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Behavior</h3>
            </div>
            {renderText(data.customerBehavior)}
          </div>
          <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 rounded-md text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Business Trends</h3>
            </div>
            {renderText(data.businessTrends)}
          </div>
        </div>

        {/* Row 2: Revenue + Profitability + Sales — 3 cols */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <DollarSign className="w-4 h-4" />, title: "Revenue Drivers", value: data.revenueDrivers },
            { icon: <BarChart3 className="w-4 h-4" />, title: "Profitability", value: data.profitability },
            { icon: <Activity className="w-4 h-4" />, title: "Sales Performance", value: data.salesPerformance },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                {item.icon}
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
              </div>
              {renderText(item.value)}
            </div>
          ))}
        </div>

        {/* Row 3: Data Quality — 3 cols */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <PieChart className="w-4 h-4" />, title: "Data Distribution", value: data.dataDistribution },
            { icon: <Layers className="w-4 h-4" />, title: "Correlations", value: data.correlations },
            { icon: <Activity className="w-4 h-4" />, title: "Seasonality", value: data.seasonality },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                {item.icon}
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
              </div>
              {renderText(item.value)}
            </div>
          ))}
        </div>

        {/* Row 4: AI Insights + Business Risks */}
        <div className="grid grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 rounded-md text-amber-600">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Insights</h3>
            </div>
            {renderList(data.aiInsights)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-rose-100 dark:bg-rose-950/60 rounded-md text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Business Risks</h3>
            </div>
            {typeof data.businessRisks === 'string'
              ? renderText(data.businessRisks)
              : renderList(data.businessRisks, "bg-rose-500")}
          </div>
        </div>

        {/* Row 5: Forecast + Department (if present) */}
        {(data.forecastOpportunities || data.departmentPerformance) && (
          <div className="grid grid-cols-2 gap-5">
            {data.forecastOpportunities && (
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-4 h-4" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Forecast Opportunities</h3>
                </div>
                {renderList(data.forecastOpportunities)}
              </div>
            )}
            {data.departmentPerformance && (
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Department Performance</h3>
                </div>
                {renderText(data.departmentPerformance)}
              </div>
            )}
          </div>
        )}

        {/* Conclusion: Business Recommendations */}
        {data.businessRecommendations && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-6 border border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Business Recommendations</h3>
            </div>
            <ul className="space-y-2.5">
              {(Array.isArray(data.businessRecommendations) ? data.businessRecommendations : [data.businessRecommendations]).map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  )
}
