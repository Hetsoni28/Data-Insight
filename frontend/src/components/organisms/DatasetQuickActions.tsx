import { Upload, Sparkles, LayoutDashboard, FileSpreadsheet, ArrowUpRight } from "lucide-react"

export function DatasetQuickActions({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    {
      id: "upload",
      title: "Upload Dataset",
      subtitle: "CSV, Excel, JSON file ingestion",
      icon: Upload,
      gradient: "from-emerald-500 to-teal-600",
      glow: "hover:shadow-emerald-500/20 hover:border-emerald-500/40",
      badge: "Fast Upload",
    },
    {
      id: "ai-excel",
      title: "Generate AI Excel",
      subtitle: "Auto-analyze & format workbook",
      icon: FileSpreadsheet,
      gradient: "from-teal-500 to-cyan-600",
      glow: "hover:shadow-teal-500/20 hover:border-teal-500/40",
      badge: "AI Powered",
    },
    {
      id: "dashboard",
      title: "Create Dashboard",
      subtitle: "Visualize metrics instantly",
      icon: LayoutDashboard,
      gradient: "from-indigo-500 to-violet-600",
      glow: "hover:shadow-indigo-500/20 hover:border-indigo-500/40",
      badge: "Interactive",
    },
    {
      id: "analyze",
      title: "Analyze Dataset",
      subtitle: "Run deep data quality check",
      icon: Sparkles,
      gradient: "from-amber-500 to-orange-600",
      glow: "hover:shadow-amber-500/20 hover:border-amber-500/40",
      badge: "Profiling",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon
        return (
          <button
            key={act.id}
            onClick={() => onAction(act.id)}
            className={`group relative overflow-hidden flex items-center gap-4 p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-xl ${act.glow} transition-all duration-300 active:scale-[0.99] text-left`}
          >
            {/* Top Right Arrow Indicator */}
            <div className="absolute top-3 right-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            <div className={`p-3 rounded-xl bg-gradient-to-br ${act.gradient} text-white shadow-md group-hover:scale-105 transition-transform duration-300 shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {act.title}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {act.subtitle}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
