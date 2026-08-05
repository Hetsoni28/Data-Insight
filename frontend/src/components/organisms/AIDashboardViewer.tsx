import React from "react"
import { Brain, Activity, TrendingUp, LineChart, Target, ShieldCheck, Zap, Database } from "lucide-react"

interface AIDashboardViewerProps {
  report: any
}

export function AIDashboardViewer({ report }: AIDashboardViewerProps) {
  const data = report?.ai_blueprint
  if (!data) return <div className="p-8 text-center text-slate-500 font-medium">No AI Blueprint data found.</div>

  const renderScore = (score: number, label: string) => {
    const color = score >= 80 ? '#059669' : score >= 50 ? '#f59e0b' : '#ef4444'
    const textColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
    return (
      <div className="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative w-14 h-14 mb-2">
          <svg className="w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke={color} strokeWidth="4"
              strokeDasharray={`${(150 * score) / 100} 150`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-extrabold ${textColor}`}>{score}%</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center leading-tight">{label}</span>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center gap-3 border-b border-slate-700/60">
        <Brain className="w-6 h-6 text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white truncate">{report.title}</h2>
          <p className="text-xs text-slate-400 leading-tight">Deep AI Data Profiling & Statistical Analysis</p>
        </div>
      </div>

      <div className="p-6 space-y-7">

        {/* Confidence Scores — 3 cols */}
        {data.confidenceScores && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">AI Confidence Metrics</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {renderScore(data.confidenceScores.dataQuality, "Data Quality")}
              {renderScore(data.confidenceScores.predictability, "Predictability")}
              {renderScore(data.confidenceScores.overallConfidence, "Overall Confidence")}
            </div>
          </div>
        )}

        {/* Data Health + Statistical — 2 cols */}
        <div className="grid grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Data Health</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Missing Values", value: data.missingValues },
                { label: "Anomalies & Outliers", value: data.outliers },
                { label: "Data Distribution", value: data.dataDistribution },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Statistical Discoveries</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Feature Correlations", value: data.correlations },
                { label: "Seasonality / Time Trends", value: data.seasonality },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Analysis — 3 cols */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <LineChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Deep Business Analysis</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: "Customer Behavior", value: data.customerBehavior },
              { title: "Sales Performance", value: data.salesPerformance },
              { title: "Revenue Drivers", value: data.revenueDrivers },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights + Recommendations — 2 cols */}
        <div className="bg-emerald-950/20 dark:bg-emerald-950/40 rounded-xl px-5 py-5 border border-emerald-500/20">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Key AI Insights</h3>
              </div>
              <ul className="space-y-2">
                {data.aiInsights?.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {data.businessRecommendations?.map((item: string, i: number) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="leading-relaxed">{item}</span>
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
