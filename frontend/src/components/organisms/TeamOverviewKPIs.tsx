"use client"
import { motion } from "framer-motion"
import { Users, UserCheck, Mail, ShieldAlert } from "lucide-react"

export function TeamOverviewKPIs({ stats }: { stats: any }) {
  if (!stats) return null

  const metrics = [
    {
      title: "Total Members",
      value: stats.total_members,
      icon: Users,
      color: "#10B981",
      bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20",
      border: "border-emerald-200/80 dark:border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/10"
    },
    {
      title: "Online Now",
      value: stats.online_now,
      icon: UserCheck,
      color: "#06B6D4",
      bg: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20",
      border: "border-cyan-200/80 dark:border-cyan-500/20 hover:border-cyan-500/50 hover:shadow-cyan-500/10",
      isOnline: true
    },
    {
      title: "Pending Invites",
      value: stats.pending_invitations,
      icon: Mail,
      color: "#F59E0B",
      bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20",
      border: "border-amber-200/80 dark:border-amber-500/20 hover:border-amber-500/50 hover:shadow-amber-500/10"
    },
    {
      title: "Organization Admins",
      value: stats.total_admins,
      icon: ShieldAlert,
      color: "#F43F5E",
      bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20",
      border: "border-rose-200/80 dark:border-rose-500/20 hover:border-rose-500/50 hover:shadow-rose-500/10"
    }
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
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div 
            key={index}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border ${metric.border} rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-default relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{metric.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {metric.value?.toLocaleString() ?? 0}
                  </h3>
                  {metric.isOnline && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3.5 rounded-xl ${metric.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
