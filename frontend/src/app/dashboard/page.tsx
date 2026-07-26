"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard, Database, FileSpreadsheet, Brain, Settings,
  LogOut, Bell, ChevronDown, BarChart3, TrendingUp, Users,
  Upload, Plus, Loader2, Building2,
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import type { Workspace } from "@/types"

// ── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { icon: LayoutDashboard, label: "Overview",   href: "/dashboard",           active: true  },
  { icon: Database,         label: "Datasets",   href: "/dashboard/datasets",  active: false },
  { icon: FileSpreadsheet,  label: "Reports",    href: "/dashboard/reports",   active: false },
  { icon: Brain,            label: "AI Copilot", href: "/dashboard/ai",        active: false },
  { icon: Settings,         label: "Settings",   href: "/dashboard/settings",  active: false },
]

// ── Quick-stat card ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWs, setActiveWs] = useState<Workspace | null>(null)
  const [loadingWs, setLoadingWs] = useState(true)

  // Fetch workspaces on mount
  useEffect(() => {
    if (!user?.tenant_id) return
    api.get<Workspace[]>("/workspaces")
      .then(({ data }) => {
        setWorkspaces(data)
        if (data.length > 0) setActiveWs(data[0])
      })
      .catch(() => toast.error("Could not load workspaces."))
      .finally(() => setLoadingWs(false))
  }, [user?.tenant_id])

  const handleLogout = async () => {
    try { await api.post("/auth/logout") } catch { /* ignore */ }
    logout()
    router.push("/login")
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U"

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#10B981] to-emerald-700 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">Data Insight</span>
          </div>
        </div>

        {/* Workspace picker */}
        <div className="px-3 py-3 border-b border-slate-100">
          {loadingWs ? (
            <div className="flex items-center gap-2 px-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400">Loading...</span>
            </div>
          ) : workspaces.length === 0 ? (
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#10B981] hover:bg-emerald-50 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create workspace
            </button>
          ) : (
            <button className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{activeWs?.icon ?? "📊"}</span>
                <span className="text-sm font-medium text-slate-800 truncate">{activeWs?.name}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ icon: Icon, label, href, active }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-emerald-50 text-[#10B981] font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom — user + logout */}
        <div className="px-3 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-default">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#10B981] to-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">
                {user?.full_name ?? user?.email}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="p-1 hover:text-red-500 text-slate-400 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Overview</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#10B981] rounded-full" />
            </button>
            <Button
              onClick={() => router.push("/dashboard/datasets")}
              className="h-8 bg-[#10B981] hover:bg-[#059669] text-white text-xs gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Dataset
            </Button>
          </div>
        </header>

        <div className="px-8 py-7 space-y-8">
          {/* Welcome banner for new users */}
          {user && !user.tenant_id && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-[#10B981] to-emerald-600 rounded-xl p-5 text-white flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">Complete your setup</p>
                <p className="text-sm text-emerald-100 mt-0.5">Create your organization to start uploading data and generating reports.</p>
              </div>
              <Button
                onClick={() => router.push("/onboarding")}
                className="bg-white text-[#10B981] hover:bg-emerald-50 font-semibold text-sm gap-1.5"
              >
                <Building2 className="h-4 w-4" />
                Set up org
              </Button>
            </motion.div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={Database}         label="Datasets"       value="0"   sub="Upload your first dataset"          color="bg-blue-500"    />
            <StatCard icon={FileSpreadsheet}  label="Reports"        value="0"   sub="Generate your first AI report"      color="bg-[#10B981]"   />
            <StatCard icon={TrendingUp}       label="AI Analyses"    value="0"   sub="Ask questions about your data"      color="bg-violet-500"  />
            <StatCard icon={Users}            label="Team members"   value="1"   sub={`${user?.role ?? "member"} access`} color="bg-amber-500"   />
          </div>

          {/* Empty state — getting started */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-10 text-center"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Your dashboard is empty
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Upload a CSV, XLSX, or JSON file and let Data Insight AI profile it, find insights, and generate a board-ready Excel report.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => router.push("/dashboard/datasets")}
                className="h-9 bg-[#10B981] hover:bg-[#059669] text-white gap-2 text-sm"
              >
                <Upload className="h-4 w-4" />
                Upload your first dataset
              </Button>
              <Button
                variant="outline"
                className="h-9 text-sm border-slate-200 gap-2"
                onClick={() => router.push("/dashboard/reports")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                View reports
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
