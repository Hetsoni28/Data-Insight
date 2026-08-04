import { Button } from "@/components/ui/button"
import { Database, FileText, UserPlus, Settings2 } from "lucide-react"

export function OrganizationQuickActions() {
  const actions = [
    {
      title: "Generate AI Excel",
      description: "Ask AI to generate a report",
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
    },
    {
      title: "Upload Dataset",
      description: "Add new data to analyze",
      icon: Database,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
    },
    {
      title: "Invite Team Member",
      description: "Grow your organization",
      icon: UserPlus,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
    },
    {
      title: "Manage Settings",
      description: "Configure billing & access",
      icon: Settings2,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, i) => (
        <button
          key={i}
          className={`flex items-start text-left p-6 rounded-3xl transition-all duration-200 border border-transparent ${action.bg}`}
        >
          <div className="flex-shrink-0">
            <action.icon className={`h-8 w-8 ${action.color}`} />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">{action.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
