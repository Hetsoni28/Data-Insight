"use client"
import type { Workspace } from "@/types"
import { SidebarNav } from "@/components/molecules/SidebarNav"
import { WorkspacePicker } from "@/components/molecules/WorkspacePicker"
import { SidebarUserMenu } from "@/components/molecules/SidebarUserMenu"
import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

export interface NavItem { icon: any; label: string; href: string }
export interface NavGroup { title: string; items: NavItem[] }

interface DashboardSidebarProps {
  user?: any
  workspaces?: Workspace[]
  activeWs?: Workspace | null
  loadingWs?: boolean
  navGroups: NavGroup[]
  handleLogout?: () => void
}

export default function Sidebar({ user, workspaces = [], activeWs = null, loadingWs = false, navGroups = [], handleLogout }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside 
      className={`${isCollapsed ? "w-[80px]" : "w-[260px]"} bg-[#0c402d] flex flex-col flex-shrink-0 min-h-screen relative z-20 border-r border-[#082f22] shadow-2xl transition-all duration-300 ease-in-out`}
    >
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      {/* Header / Logo */}
      <div className={`px-5 py-6 flex items-center relative z-10 transition-all duration-300 ${isCollapsed ? "justify-center px-0" : ""}`}>
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
          <g id="icon" transform={isCollapsed ? "translate(265, 30)" : "translate(30, 30)"} className="transition-all duration-300">
            <path d="M 20 100 V 0 H 50 C 83.137 0 110 22.386 110 50 C 110 77.614 83.137 100 50 100 H 20 Z" fill="none" stroke="url(#primaryGrad)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="140" y1="0" x2="140" y2="100" stroke="url(#secondaryGrad)" strokeWidth="18" strokeLinecap="round" />
            <path d="M 45 65 L 70 40 L 90 55 L 140 10" fill="none" stroke="url(#accentGrad)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
            <circle cx="140" cy="10" r="6" fill="#FFFFFF" />
            <circle cx="45" cy="65" r="4.5" fill="#FFFFFF" />
          </g>
          {!isCollapsed && (
            <g id="wordmark" transform="translate(220, 105)" className="transition-opacity duration-300">
              <text fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Geist', 'SF Pro Display', sans-serif" fontSize="72" fill="#FFFFFF">
                <tspan fontWeight="800" letterSpacing="-0.03em">Data</tspan>
                <tspan fontWeight="500" fill="#10B981" letterSpacing="-0.02em" dx="2">Insight</tspan>
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Workspace picker — overflow-visible so dropdown escapes sidebar bounds */}
      <div className={`px-4 pb-6 relative z-[100] transition-all duration-300 ${isCollapsed ? "px-2" : ""}`}>
        <WorkspacePicker workspaces={workspaces} activeWs={activeWs} loadingWs={loadingWs} isCollapsed={isCollapsed} />
      </div>


      <SidebarNav navGroups={navGroups} isCollapsed={isCollapsed} />

      <div className="mt-auto relative z-10 flex flex-col">
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-3 p-4 hover:bg-white/5 text-emerald-100/60 hover:text-white transition-all border-t border-[#082f22] ${isCollapsed ? "justify-center" : "px-5"}`}
        >
          {isCollapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!isCollapsed && <span className="text-[13px] font-bold tracking-wide">Collapse sidebar</span>}
        </button>
        
        <SidebarUserMenu user={user} handleLogout={handleLogout} isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}
