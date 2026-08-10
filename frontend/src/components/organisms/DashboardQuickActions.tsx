"use client"
import { motion } from "framer-motion"
import { UploadCloud, FileBarChart, UserPlus, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export function DashboardQuickActions() {
  const router = useRouter()
  const { data: user } = useAuth()
  
  const getBasePath = () => {
    if (user?.role === "owner" || (user?.role as string) === "organization-admin" || (user?.role as string) === "org_admin") return "/organization-admin"
    return `/${user?.role || "analyst"}`
  }

  const actions = [
    {
      title: "Upload Dataset",
      description: "Add new Excel or CSV data",
      icon: UploadCloud,
      color: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-700",
      onClick: () => router.push(`${getBasePath()}/dashboard/upload-dataset`)
    },
    {
      title: "Generate Report",
      description: "Create AI insights",
      icon: FileBarChart,
      color: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-700",
      onClick: () => router.push("/dashboard/reports")
    },
    {
      title: "Invite Team",
      description: "Add members to workspace",
      icon: UserPlus,
      color: "bg-violet-500",
      lightBg: "bg-violet-50",
      textColor: "text-violet-700",
      onClick: () => router.push("/dashboard/users")
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden relative"
    >
      {/* Subtle top accent gradient */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />

      <div className="p-6 border-b border-slate-100 dark:border-white/5 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Zap className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Quick Actions</h3>
        </div>
      </div>

      <div className="p-4 space-y-3 relative z-10">
        {actions.map((action, idx) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className="w-full group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:border-white/10 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
          >
            {/* Subtle hover background tint */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${action.color}`} />
            
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${action.lightBg} border border-white`}>
              <action.icon className={`h-5 w-5 ${action.textColor}`} />
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:hover:text-white transition-colors">
                {action.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
