import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Upload, FilePlus2, Sparkles, BarChart2 } from "lucide-react"

export function ManagerQuickActions() {
  const router = useRouter()
  
  const actions = [
    {
      title: "Upload Dataset",
      description: "Add new data to your tenant",
      icon: Upload,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      action: () => router.push("/manager/dashboard/datasets?upload=true")
    },
    {
      title: "Create Report",
      description: "Generate a new business report",
      icon: FilePlus2,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      action: () => router.push("/manager/dashboard/reports/new")
    },
    {
      title: "AI Analysis",
      description: "Ask questions about your data",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      action: () => router.push("/manager/dashboard/ai")
    },
    {
      title: "View Dashboards",
      description: "Explore custom visual dashboards",
      icon: BarChart2,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      action: () => router.push("/manager/dashboard/custom-dashboards")
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, i) => (
        <motion.button
          key={action.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={action.action}
          className="flex items-center text-left gap-4 p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
            <action.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {action.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {action.description}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
