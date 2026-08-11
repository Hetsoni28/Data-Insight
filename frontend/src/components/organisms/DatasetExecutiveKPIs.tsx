import { Database, Cpu, AlertTriangle, HardDrive, LayoutDashboard, FileSpreadsheet, Activity, Sparkles } from "lucide-react"

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DatasetExecutiveKPIs({ stats }: { stats: any }) {
  if (!stats) return null
  
  const kpis = [
    {
      title: "Total Datasets",
      value: stats.total_datasets,
      icon: Database,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      accent: "group-hover:border-emerald-500/40",
      glow: "group-hover:shadow-emerald-500/10",
    },
    {
      title: "Processing",
      value: stats.processing_jobs,
      icon: Cpu,
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      accent: "group-hover:border-amber-500/40",
      glow: "group-hover:shadow-amber-500/10",
      pulse: stats.processing_jobs > 0,
    },
    {
      title: "Failed Jobs",
      value: stats.failed_jobs,
      icon: AlertTriangle,
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      iconBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      accent: "group-hover:border-rose-500/40",
      glow: "group-hover:shadow-rose-500/10",
    },
    {
      title: "Storage Used",
      value: formatBytes(stats.storage_used_bytes),
      icon: HardDrive,
      gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
      iconBg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      accent: "group-hover:border-cyan-500/40",
      glow: "group-hover:shadow-cyan-500/10",
    },
    {
      title: "Rows Analyzed",
      value: stats.rows_processed > 1000 ? (stats.rows_processed / 1000).toFixed(1) + 'k' : stats.rows_processed,
      icon: Activity,
      gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/10 text-violet-500 border-violet-500/20",
      accent: "group-hover:border-violet-500/40",
      glow: "group-hover:shadow-violet-500/10",
    },
    {
      title: "Quality Score",
      value: `${stats.avg_quality_score ? stats.avg_quality_score.toFixed(0) : 0}%`,
      icon: Sparkles,
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      accent: "group-hover:border-indigo-500/40",
      glow: "group-hover:shadow-indigo-500/10",
    },
    {
      title: "Dashboards",
      value: stats.dashboards_created,
      icon: LayoutDashboard,
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      accent: "group-hover:border-blue-500/40",
      glow: "group-hover:shadow-blue-500/10",
    },
    {
      title: "AI Excels",
      value: stats.ai_excel_generated,
      icon: FileSpreadsheet,
      gradient: "from-teal-500/10 via-teal-500/5 to-transparent",
      iconBg: "bg-teal-500/10 text-teal-500 border-teal-500/20",
      accent: "group-hover:border-teal-500/40",
      glow: "group-hover:shadow-teal-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon
        return (
          <div
            key={index}
            className={`group relative overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-lg ${kpi.glow} transition-all duration-300 ${kpi.accent} flex flex-col justify-between`}
          >
            {/* Subtle Gradient Glow background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {kpi.title}
              </p>
              <div className={`p-1.5 rounded-lg border ${kpi.iconBg} relative`}>
                <Icon className="w-3.5 h-3.5" />
                {kpi.pulse && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {kpi.value}
              </h3>
            </div>
          </div>
        )
      })}
    </div>
  )
}
