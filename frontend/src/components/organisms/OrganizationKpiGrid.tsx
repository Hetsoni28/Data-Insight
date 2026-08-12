"use client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, Database, FileText, HardDrive, Cpu, ChevronRight } from "lucide-react"
import { TrendBadge } from "@/components/molecules/TrendBadge"

interface KPIs {
  active_users: number
  datasets: { total: number; growth: number }
  reports: { total: number; growth: number }
  storage_mb: number
  ai_requests: { total: number; growth: number }
}

export function OrganizationKpiGrid({ kpis }: { kpis: KPIs | null }) {
  const router = useRouter()
  if (!kpis) return null

  const cards = [
    { 
      title: "Active Members", 
      value: kpis.active_users, 
      growth: undefined, 
      icon: Users, 
      color: "#10B981", 
      lightBg: "bg-emerald-50/70 dark:bg-emerald-500/10", 
      border: "border-emerald-200/80 dark:border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/10", 
      link: "/organization-admin/dashboard/team" 
    },
    { 
      title: "Datasets", 
      value: kpis.datasets?.total, 
      growth: kpis.datasets?.growth, 
      icon: Database, 
      color: "#3B82F6", 
      lightBg: "bg-blue-50/70 dark:bg-blue-500/10", 
      border: "border-blue-200/80 dark:border-blue-500/20 hover:border-blue-500/50 hover:shadow-blue-500/10", 
      link: "/organization-admin/dashboard/datasets" 
    },
    { 
      title: "Reports", 
      value: kpis.reports?.total, 
      growth: kpis.reports?.growth, 
      icon: FileText, 
      color: "#8B5CF6", 
      lightBg: "bg-violet-50/70 dark:bg-violet-500/10", 
      border: "border-violet-200/80 dark:border-violet-500/20 hover:border-violet-500/50 hover:shadow-violet-500/10", 
      link: "/organization-admin/dashboard/reports" 
    },
    { 
      title: "Storage Used", 
      value: `${(kpis.storage_mb || 0).toFixed(1)} MB`, 
      growth: undefined, 
      icon: HardDrive, 
      color: "#F59E0B", 
      lightBg: "bg-amber-50/70 dark:bg-amber-500/10", 
      border: "border-amber-200/80 dark:border-amber-500/20 hover:border-amber-500/50 hover:shadow-amber-500/10", 
      link: undefined 
    },
    { 
      title: "AI Requests", 
      value: kpis.ai_requests?.total, 
      growth: kpis.ai_requests?.growth, 
      icon: Cpu, 
      color: "#06B6D4", 
      lightBg: "bg-cyan-50/70 dark:bg-cyan-500/10", 
      border: "border-cyan-200/80 dark:border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-cyan-500/10", 
      link: "/organization-admin/dashboard/ai" 
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 15, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {cards.map((m, i) => (
        <motion.div 
          key={i}
          variants={item}
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => m.link && router.push(m.link)}
          className={`group relative overflow-hidden rounded-2xl border ${m.border} ${m.lightBg} bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:shadow-lg cursor-pointer p-5 flex flex-col justify-between`}
        >
          {/* Subtle hover gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-white/10 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ color: m.color }}>
                <m.icon className="h-5 w-5" />
              </div>
              <TrendBadge growth={m.growth} />
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mb-0.5 tracking-tight">
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{m.title}</div>
          </div>

          {m.link ? (
            <div className="mt-3.5 pt-2.5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-xs font-bold transition-all relative z-10" style={{ color: m.color }}>
              <span>View details</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          ) : (
            <div className="mt-3.5 pt-2.5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span>Tenant storage</span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
