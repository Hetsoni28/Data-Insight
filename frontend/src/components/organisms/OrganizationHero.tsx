"use client"
import Link from "next/link"
import { Users, Database, FileText, Cpu, UploadCloud, Plus, Sparkles, Star, Clock, RefreshCw } from "lucide-react"
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
    { label: "Upload Dataset", icon: UploadCloud, href: "/organization-admin/dashboard/datasets", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    { label: "New Report", icon: Plus, href: "/organization-admin/dashboard/reports", color: "bg-violet-600 hover:bg-violet-700 text-white" },
    { label: "AI Builder", icon: Sparkles, href: "/organization-admin/dashboard/builder", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "Settings", icon: Star, href: "/organization-admin/dashboard/settings", color: "bg-slate-700 hover:bg-slate-800 text-white" },
  ]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2e1e] via-[#0d3a26] to-[#0B1A14] border border-emerald-900/40 shadow-2xl text-white">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 p-8 md:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-sm font-medium text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {overview?.platform_status ?? "Operational"}
              </span>
              <span className="text-xs text-emerald-200/80 capitalize">
                {overview?.subscription_plan} Plan &bull; {overview?.current_ai_provider}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {overview?.greeting ?? "Welcome back"}
            </h1>
            <p className="text-emerald-200/70 text-base md:text-lg">
              Managing <span className="text-white font-semibold">{overview?.organization_name}</span>. Your enterprise command center &mdash; all insights, live.
            </p>
            {kpis && (
              <div className="flex flex-wrap gap-3 pt-2">
                {[
                  { label: "Members", val: kpis.active_users, icon: Users },
                  { label: "Datasets", val: kpis.datasets?.total, icon: Database },
                  { label: "Reports", val: kpis.reports?.total, icon: FileText },
                  { label: "AI Calls", val: kpis.ai_requests?.total, icon: Cpu },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                    <s.icon className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-white font-bold text-sm">{s.val?.toLocaleString()}</span>
                    <span className="text-emerald-200/80 text-xs">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[260px]">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(a => (
                <Link key={a.label} href={a.href}>
                  <button className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${a.color}`}>
                    <a.icon className="h-4 w-4" />{a.label}
                  </button>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-300/70">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Refreshed {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </span>
              <button onClick={onRefresh} disabled={refreshing}
                className="flex items-center gap-1 text-emerald-300 hover:text-white transition-colors">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
