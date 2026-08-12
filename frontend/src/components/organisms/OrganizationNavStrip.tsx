"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Database, FileText, Users, Sparkles, ChevronRight } from "lucide-react"

const LINKS = [
  { label: "Datasets Center", icon: Database, href: "/organization-admin/dashboard/datasets", color: "#3B82F6", lightBg: "bg-blue-50/70 dark:bg-blue-500/10", border: "border-blue-200/80 dark:border-blue-500/20 hover:border-blue-500/50 hover:shadow-blue-500/10" },
  { label: "Reports Hub", icon: FileText, href: "/organization-admin/dashboard/reports", color: "#8B5CF6", lightBg: "bg-violet-50/70 dark:bg-violet-500/10", border: "border-violet-200/80 dark:border-violet-500/20 hover:border-violet-500/50 hover:shadow-violet-500/10" },
  { label: "Team Management", icon: Users, href: "/organization-admin/dashboard/team", color: "#10B981", lightBg: "bg-emerald-50/70 dark:bg-emerald-500/10", border: "border-emerald-200/80 dark:border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/10" },
  { label: "AI Dashboard", icon: Sparkles, href: "/organization-admin/dashboard/ai", color: "#06B6D4", lightBg: "bg-cyan-50/70 dark:bg-cyan-500/10", border: "border-cyan-200/80 dark:border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-cyan-500/10" },
]

export function OrganizationNavStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {LINKS.map(item => (
        <Link key={item.label} href={item.href}>
          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group flex items-center gap-3.5 p-4 rounded-2xl border ${item.border} ${item.lightBg} bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:shadow-lg cursor-pointer`}
          >
            <div className="p-3 rounded-xl bg-white dark:bg-white/10 shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ color: item.color }}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">{item.label}</p>
              <p className="text-[11px] font-bold flex items-center gap-1 mt-0.5" style={{ color: item.color }}>
                <span>Open center</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  )
}
