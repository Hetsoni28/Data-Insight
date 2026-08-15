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
      bg: "bg-blue-500/10",
      borderHover: "hover:border-blue-500/50",
      glow: "group-hover:bg-blue-500/20",
      action: () => router.push("/manager/dashboard/datasets")
    },
    {
      title: "Create Report",
      description: "Generate a new business report",
      icon: FilePlus2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderHover: "hover:border-emerald-500/50",
      glow: "group-hover:bg-emerald-500/20",
      action: () => router.push("/manager/dashboard/reports")
    },
    {
      title: "AI Analysis",
      description: "Ask questions about your data",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      borderHover: "hover:border-purple-500/50",
      glow: "group-hover:bg-purple-500/20",
      action: () => router.push("/manager/dashboard/ai")
    },
    {
      title: "View Analytics",
      description: "Explore data visualizations",
      icon: BarChart2,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      borderHover: "hover:border-amber-500/50",
      glow: "group-hover:bg-amber-500/20",
      action: () => router.push("/manager/dashboard/analytics")
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {actions.map((action, i) => (
        <motion.button
          key={action.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
          onClick={action.action}
          className={`relative flex items-center text-left gap-4 p-5 rounded-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden ${action.borderHover}`}
        >
          {/* Animated Background Glow */}
          <div className={`absolute -inset-4 blur-xl opacity-0 transition-opacity duration-500 -z-10 ${action.glow}`} />
          
          <div className={`w-12 h-12 rounded-none flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-500`}>
            <action.icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white transition-colors">
              {action.title}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {action.description}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
