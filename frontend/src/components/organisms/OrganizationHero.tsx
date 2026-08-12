"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Users, Database, FileText, Cpu, UploadCloud, Plus, Sparkles, Star, Clock, RefreshCw, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface HeroProps {
  overview: {
    organization_name: string; subscription_plan: string
    platform_status: string; current_ai_provider: string; greeting: string
  } | null
  kpis: {
    active_users: number
    datasets: { total: number }
    reports: { total: number }
    ai_requests: { total: number }
  } | null
  lastRefreshed: Date
  refreshing: boolean
  onRefresh: () => void
}

export function OrganizationHero({ overview, kpis, lastRefreshed, refreshing, onRefresh }: HeroProps) {
  const quickActions = [
    { label: "Upload Dataset", icon: UploadCloud, href: "/organization-admin/dashboard/datasets", color: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20" },
    { label: "New Report", icon: Plus, href: "/organization-admin/dashboard/reports", color: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20" },
    { label: "AI Builder", icon: Sparkles, href: "/organization-admin/dashboard/builder", color: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" },
    { label: "Settings", icon: Star, href: "/organization-admin/dashboard/settings", color: "bg-slate-800/90 hover:bg-slate-700 text-white border border-white/10 shadow-slate-900/40" },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#062419] via-[#093322] to-[#04140D] border border-emerald-500/20 shadow-2xl text-white">
      {/* Dynamic ambient lights */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-emerald-500/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-60 h-60 bg-emerald-400/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 p-8 md:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {overview?.platform_status ?? "Operational"}
              </span>
              <span className="text-xs text-emerald-200/80 capitalize font-medium flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                {overview?.subscription_plan ?? "Enterprise"} Plan &bull; {overview?.current_ai_provider ?? "GPT-4o"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {overview?.greeting ?? "Welcome back"}
            </h1>
            <p className="text-emerald-100/75 text-sm md:text-base leading-relaxed max-w-xl">
              Managing <span className="text-white font-bold underline decoration-emerald-500/50 underline-offset-4">{overview?.organization_name}</span>. Your real-time organization intelligence command center.
            </p>
            {kpis && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {[
                  { label: "Members", val: kpis.active_users, icon: Users, color: "text-emerald-400" },
                  { label: "Datasets", val: kpis.datasets?.total, icon: Database, color: "text-blue-400" },
                  { label: "Reports", val: kpis.reports?.total, icon: FileText, color: "text-violet-400" },
                  { label: "AI Calls", val: kpis.ai_requests?.total, icon: Cpu, color: "text-cyan-400" },
                ].map(s => (
                  <motion.div 
                    key={s.label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3.5 py-1.5 backdrop-blur-md shadow-sm"
                  >
                    <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                    <span className="text-white font-extrabold text-sm">{s.val?.toLocaleString() ?? 0}</span>
                    <span className="text-emerald-200/80 text-xs font-medium">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[280px]">
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map(a => (
                <Link key={a.label} href={a.href}>
                  <motion.button 
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${a.color}`}
                  >
                    <a.icon className="h-3.5 w-3.5" />{a.label}
                  </motion.button>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-300/80 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 backdrop-blur-md">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Refreshed {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </span>
              <button 
                onClick={onRefresh} 
                disabled={refreshing}
                className="flex items-center gap-1.5 text-emerald-300 hover:text-white font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
                {refreshing ? "Syncing..." : "Sync"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
