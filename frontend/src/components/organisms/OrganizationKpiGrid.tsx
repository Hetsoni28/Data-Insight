"use client"
import { useRouter } from "next/navigation"
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
    { title: "Active Members", value: kpis.active_users, growth: undefined, icon: Users, color: "#10B981", lightBg: "bg-emerald-50/70 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", link: "/organization-admin/dashboard/team" },
    { title: "Datasets", value: kpis.datasets?.total, growth: kpis.datasets?.growth, icon: Database, color: "#3B82F6", lightBg: "bg-blue-50/70 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", link: "/organization-admin/dashboard/datasets" },
    { title: "Reports", value: kpis.reports?.total, growth: kpis.reports?.growth, icon: FileText, color: "#8B5CF6", lightBg: "bg-violet-50/70 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20", link: "/organization-admin/dashboard/reports" },
    { title: "Storage Used", value: `${(kpis.storage_mb || 0).toFixed(1)} MB`, growth: undefined, icon: HardDrive, color: "#F59E0B", lightBg: "bg-amber-50/70 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", link: undefined },
    { title: "AI Requests", value: kpis.ai_requests?.total, growth: kpis.ai_requests?.growth, icon: Cpu, color: "#06B6D4", lightBg: "bg-cyan-50/70 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20", link: "/organization-admin/dashboard/ai" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((m, i) => (
        <div key={i}
          onClick={() => m.link && router.push(m.link)}
          className={`group relative overflow-hidden rounded-2xl border ${m.border} ${m.lightBg} bg-white dark:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer p-5`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/10 shadow-xs" style={{ color: m.color }}>
                <m.icon className="h-5 w-5" />
              </div>
              <TrendBadge growth={m.growth} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{m.title}</div>
            {m.link && (
              <div className="mt-3 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-semibold" style={{ color: m.color }}>
                View details <ChevronRight className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
