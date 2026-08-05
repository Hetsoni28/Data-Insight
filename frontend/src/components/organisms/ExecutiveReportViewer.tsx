import React from "react"
import { Building2, TrendingUp, DollarSign, Activity, AlertTriangle, Lightbulb, CheckCircle2, ShieldCheck, FileSpreadsheet, FileText, BarChart3, Target } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface ExecutiveReportViewerProps {
  report: any
}

export function ExecutiveReportViewer({ report }: ExecutiveReportViewerProps) {
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

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">

      {/* ── HEADER: Always horizontal, compact ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-700/60">
        {/* Left: badge + title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Executive AI Report
          </div>
          <h2 className="text-lg font-bold text-white leading-tight truncate">{report.title}</h2>
        </div>
        {/* Right: action buttons — always inline */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/60 rounded-lg text-xs font-semibold transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" /> PDF
          </button>
          <button
            onClick={() => handleDownload('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* ── DATASET SUMMARY strip ── */}
      {data.datasetSummary && (
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{data.datasetSummary}</p>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="p-6 space-y-8">

        {/* Company Overview & Highlights — 2 cols */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 rounded-md text-emerald-600 dark:text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Company Overview</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{data.companyOverview}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 rounded-md text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Business Highlights</h3>
            </div>
            <ul className="space-y-2">
              {data.businessHighlights?.map((hl: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{hl}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Executive KPIs — 4-col grid, fixed height cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Executive KPIs</h3>
          </div>
          <div className="grid grid-cols-4 gap-3.5">
            {data.executiveKPIs?.map((kpi: any, i: number) => {
              const isNeg = kpi.trend?.toLowerCase().includes('down') || kpi.trend?.toLowerCase().includes('critical') || kpi.trend?.toLowerCase().includes('high churn')
              return (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold block mb-1.5 leading-tight">{kpi.label}</span>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">{kpi.value}</div>
                  </div>
                  {kpi.trend && (
                    <div className="mt-3">
                      <span className={`text-[11px] font-medium p-2 rounded-lg border block leading-snug break-normal ${
                        isNeg
                          ? 'text-rose-700 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/50'
                          : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/50'
                      }`}>{kpi.trend}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue / Profit / Growth — 3 cols */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <DollarSign className="w-4 h-4" />, title: "Revenue Overview", value: data.revenueOverview },
            { icon: <TrendingUp className="w-4 h-4" />, title: "Profit Analysis", value: data.profitAnalysis },
            { icon: <Activity className="w-4 h-4" />, title: "Growth Analysis", value: data.growthAnalysis },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                {item.icon}
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Top Insights & Risks — 2 cols */}
        <div className="grid grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/60 rounded-md text-amber-600">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Insights</h3>
            </div>
            <ul className="space-y-2.5">
              {data.topInsights?.map((item: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-rose-100 dark:bg-rose-950/60 rounded-md text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Potential Risks</h3>
            </div>
            <ul className="space-y-2.5">
              {data.potentialRisks?.map((item: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conclusion & Action Plan */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-xl p-6 text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Executive Conclusion & Action Plan</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-5">{data.executiveConclusion}</p>

          <div className="grid grid-cols-2 gap-6 border-t border-slate-800/80 pt-5">
            <div>
              <h4 className="text-[10px] font-bold text-emerald-400 mb-2.5 uppercase tracking-widest">Key Recommendations</h4>
              <ul className="space-y-2">
                {data.keyRecommendations?.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-emerald-400 font-bold shrink-0">›</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-emerald-400 mb-2.5 uppercase tracking-widest">Management Action Plan</h4>
              <ul className="space-y-2">
                {data.managementActionPlan?.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <span className="text-emerald-400 font-bold shrink-0">›</span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
