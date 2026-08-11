import { motion } from "framer-motion"
import { 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  ShieldCheck,
  Database,
  LineChart,
  Zap
} from "lucide-react"

interface QuickAction {
  id: string
  title: string
  icon: any
  description: string
  color: string
}

const quickActions: QuickAction[] = [
  { id: "exec-report", title: "Executive Report", icon: FileSpreadsheet, description: "Generate a summary of all metrics", color: "text-emerald-500" },
  { id: "analyze-revenue", title: "Analyze Revenue", icon: TrendingUp, description: "Compare MRR to last month", color: "text-emerald-500" },
  { id: "analyze-usage", title: "AI Usage", icon: Zap, description: "View API cost and token limits", color: "text-amber-500" },
  { id: "audit-security", title: "Security Review", icon: ShieldCheck, description: "Check recent audit logs", color: "text-rose-500" },
  { id: "optimize-storage", title: "Optimize Storage", icon: Database, description: "Find unused large datasets", color: "text-teal-500" },
  { id: "create-dashboard", title: "Create Dashboard", icon: LineChart, description: "Build a new KPI dashboard", color: "text-cyan-500" },
]

interface CommandCenterQuickActionsProps {
  onSelectAction: (actionId: string, title: string) => void
}

export function CommandCenterQuickActions({ onSelectAction }: CommandCenterQuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-3xl mx-auto mt-6">
      {quickActions.map((action, i) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectAction(action.id, action.title)}
            className="flex flex-col items-start p-4 text-left bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-emerald-500/50 hover:shadow-sm transition-all"
          >
            <div className={`p-2 rounded-lg bg-slate-50 dark:bg-black/20 ${action.color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{action.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{action.description}</p>
          </motion.button>
        )
      })}
    </div>
  )
}
