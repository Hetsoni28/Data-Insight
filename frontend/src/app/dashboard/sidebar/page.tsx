"use client"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard, Database, FileSpreadsheet, Brain, Settings,
  LogOut, ChevronDown, BarChart3, Plus
} from "lucide-react"
import type { Workspace } from "@/types"

const NAV = [
  { icon: LayoutDashboard, label: "Overview",   href: "/dashboard" },
  { icon: Database,         label: "Datasets",   href: "/dashboard/datasets" },
  { icon: FileSpreadsheet,  label: "Reports",    href: "/dashboard/reports" },
  { icon: Brain,            label: "AI Copilot", href: "/dashboard/ai" },
  { icon: Settings,         label: "Settings",   href: "/dashboard/settings" },
]

interface DashboardSidebarProps {
  user?: any
  workspaces?: Workspace[]
  activeWs?: Workspace | null
  loadingWs?: boolean
  handleLogout?: () => void
}

export default function Sidebar({ user, workspaces = [], activeWs = null, loadingWs = false, handleLogout }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U"

  return (
    <aside className="w-64 bg-slate-50/50 backdrop-blur-xl border-r border-slate-200/50 flex flex-col flex-shrink-0 min-h-screen relative z-20">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#10B981] to-emerald-700 rounded-xl shadow-sm flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-[15px] tracking-tight">Data Insight</span>
      </div>

      {/* Workspace picker */}
      <div className="px-4 pb-4">
        {loadingWs ? (
          <div className="w-full h-10 rounded-xl bg-slate-200/50 animate-pulse" />
        ) : workspaces.length === 0 ? (
          <button
            onClick={() => router.push("/onboarding")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100/50"
          >
            <Plus className="h-4 w-4" /> Create workspace
          </button>
        ) : (
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all group">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg bg-white rounded-md shadow-sm w-6 h-6 flex items-center justify-center border border-slate-100">{activeWs?.icon ?? "📊"}</span>
              <span className="text-[13px] font-medium text-slate-700 truncate">{activeWs?.name}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-transform group-hover:translate-y-0.5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 space-y-1 mt-2">
        {NAV.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              suppressHydrationWarning
              className={`w-full relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                isActive ? "text-emerald-700" : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm hover:border-slate-200/60"
              } border border-transparent`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-emerald-50 rounded-xl border border-emerald-100/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`h-4 w-4 flex-shrink-0 relative z-10 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="relative z-10">{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom — user + logout */}
      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 transition-all cursor-pointer group relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-700">
            <span className="text-[11px] font-medium text-white tracking-wider">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-slate-700 truncate">
              {user?.full_name ?? user?.email ?? "User"}
            </p>
            <p className="text-[11px] text-slate-400 font-medium capitalize">{user?.role ?? "member"}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleLogout?.()
            }} 
            title="Sign out" 
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 text-slate-400 rounded-lg transition-all absolute right-2"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
