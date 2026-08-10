import Link from "next/link"
import { Database, FileText, Users, Sparkles, ChevronRight } from "lucide-react"

const LINKS = [
  { label: "Datasets Center", icon: Database, href: "/organization-admin/dashboard/datasets", color: "#3B82F6" },
  { label: "Reports Hub", icon: FileText, href: "/organization-admin/dashboard/reports", color: "#8B5CF6" },
  { label: "Team Management", icon: Users, href: "/organization-admin/dashboard/team", color: "#10B981" },
  { label: "AI Dashboard", icon: Sparkles, href: "/organization-admin/dashboard/ai", color: "#06B6D4" },
]

export function OrganizationNavStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {LINKS.map(item => (
        <Link key={item.label} href={item.href}>
          <div className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-all hover:-translate-y-0.5 shadow-sm cursor-pointer">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/10" style={{ color: item.color }}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                Open <ChevronRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
