"use client"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LogOut, ChevronDown, Plus, Crown, Shield, BarChart2, Eye, Users,
  ChevronsUpDown, Command
} from "lucide-react"
import type { Workspace } from "@/types"
import { useState } from "react"

// ── Role display config ──────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  owner:     { label: "Platform Owner", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Crown    },
  org_admin: { label: "Org Admin",      bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Shield  },
  manager:   { label: "Manager",        bg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",     icon: Users    },
  analyst:   { label: "Analyst",        bg: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: BarChart2},
  viewer:    { label: "Viewer",         bg: "bg-white/10 text-white/70 border-white/20",   icon: Eye      },
}

export interface NavItem {
  icon: any;
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface DashboardSidebarProps {
  user?: any
  workspaces?: Workspace[]
  activeWs?: Workspace | null
  loadingWs?: boolean
  navGroups: NavGroup[]
  handleLogout?: () => void
}

export default function Sidebar({ user, workspaces = [], activeWs = null, loadingWs = false, navGroups = [], handleLogout }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isWorkspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const roleKey = user?.is_owner ? "owner" : (user?.role ?? "viewer")
  const roleConfig = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.viewer
  const RoleIcon = roleConfig.icon

  return (
    <aside className="w-[260px] bg-[#0c402d] flex flex-col flex-shrink-0 min-h-screen relative z-20 border-r border-[#082f22] shadow-2xl">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {/* Header / Logo */}
      <div className="px-5 py-6 flex items-center relative z-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" className="h-8 w-auto object-contain drop-shadow-sm">
          <defs>
            <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="secondaryGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#10B981" floodOpacity="0.25" />
            </filter>
          </defs>

          <g id="icon" transform="translate(30, 30)">
            <path d="M 20 100 V 0 H 50 C 83.137 0 110 22.386 110 50 C 110 77.614 83.137 100 50 100 H 20 Z" 
                  fill="none" 
                  stroke="url(#primaryGrad)" 
                  strokeWidth="18" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" />
                  
            <line x1="140" y1="0" x2="140" y2="100" 
                  stroke="url(#secondaryGrad)" 
                  strokeWidth="18" 
                  strokeLinecap="round" />

            <path d="M 45 65 L 70 40 L 90 55 L 140 10" 
                  fill="none" 
                  stroke="url(#accentGrad)" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  filter="url(#glow)" />

            <circle cx="140" cy="10" r="6" fill="#FFFFFF" />
            <circle cx="45" cy="65" r="4.5" fill="#FFFFFF" />
          </g>

          <g id="wordmark" transform="translate(220, 105)">
            <text fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Geist', 'SF Pro Display', sans-serif" fontSize="72" fill="#FFFFFF">
              <tspan fontWeight="800" letterSpacing="-0.03em">Data</tspan>
              <tspan fontWeight="500" fill="#10B981" letterSpacing="-0.02em" dx="2">Insight</tspan>
            </text>
          </g>
        </svg>
      </div>

      {/* Workspace picker */}
      <div className="px-4 pb-6 relative z-10">
        {loadingWs ? (
          <div className="w-full h-12 rounded-xl bg-white/5 animate-pulse border border-white/10" />
        ) : workspaces.length === 0 ? (
          <button
            onClick={() => router.push("/onboarding")}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium text-white bg-emerald-500/20 hover:bg-emerald-500/30 transition-all border border-emerald-400/30 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Create workspace
          </button>
        ) : (
          <button 
            onClick={() => setWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group shadow-sm bg-white/5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg bg-[#082f22] text-white rounded-lg shadow-sm w-7 h-7 flex items-center justify-center border border-white/10">
                {activeWs?.icon ?? "📊"}
              </span>
              <div className="flex flex-col items-start truncate">
                <span className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-wider">Workspace</span>
                <span className="text-[13px] font-semibold text-white truncate">{activeWs?.name}</span>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-emerald-200/50 group-hover:text-white flex-shrink-0 transition-colors" />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto custom-scrollbar relative z-10 pb-6">
        {navGroups.map((group, groupIdx) => (
          <div key={group.title} className="space-y-1.5">
            <h4 className="px-3 text-[10px] font-bold text-emerald-200/40 uppercase tracking-widest">
              {group.title}
            </h4>
            <div className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, href }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/") && href !== "/owner/dashboard"
                return (
                  <button
                    key={label}
                    onClick={() => router.push(href)}
                    suppressHydrationWarning
                    className={`w-full relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all group ${
                      isActive ? "text-white bg-white/10 shadow-sm border-white/10" : "text-emerald-100/70 hover:text-white hover:bg-white/5 border-transparent"
                    } border`}
                  >
                    {/* Active glow line */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    )}
                    <Icon className={`h-[16px] w-[16px] flex-shrink-0 relative z-10 transition-colors ${isActive ? "text-emerald-300" : "text-emerald-200/50 group-hover:text-emerald-200"}`} />
                    <span className="relative z-10 tracking-wide">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Profile Section */}
      <div className="p-4 mt-auto relative z-10 border-t border-[#082f22] bg-[#093525]">
        {/* Role badge */}
        <div className={`mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-wider ${roleConfig.bg}`}>
          <RoleIcon className="h-3.5 w-3.5 flex-shrink-0" />
          {roleConfig.label}
          {user?.is_owner && (
            <span className="ml-auto text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full border border-amber-600">
              YOU
            </span>
          )}
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group relative">
          <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-[#082f22]">
            <span className="text-[12px] font-bold text-white tracking-wider">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">
              {user?.full_name ?? user?.email ?? "User"}
            </p>
            <p className="text-[11px] text-emerald-200/50 truncate">{user?.email}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleLogout?.() }}
            title="Sign out"
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/20 text-emerald-200/50 rounded-lg transition-all absolute right-2 border border-transparent"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
