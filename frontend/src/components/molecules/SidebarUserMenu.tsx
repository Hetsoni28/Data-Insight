import { LogOut, Crown, Shield, Users, BarChart2, Eye } from "lucide-react"

const ROLE_CONFIG: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  owner:     { label: "Platform Owner", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: Crown    },
  org_admin: { label: "Org Admin",      bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Shield  },
  manager:   { label: "Manager",        bg: "bg-teal-500/20 text-teal-300 border-teal-500/30",     icon: Users    },
  analyst:   { label: "Analyst",        bg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",     icon: BarChart2},
  viewer:    { label: "Viewer",         bg: "bg-white/10 text-white/70 border-white/20",          icon: Eye      },
}

interface SidebarUserMenuProps {
  user: any
  handleLogout?: () => void
  isCollapsed?: boolean
}

export function SidebarUserMenu({ user, handleLogout, isCollapsed = false }: SidebarUserMenuProps) {
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const roleKey = user?.is_owner ? "owner" : (user?.role ?? "viewer")
  const roleConfig = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.viewer
  const RoleIcon = roleConfig.icon

  return (
    <div className={`p-4 mt-auto relative z-10 border-t border-[#082f22] bg-[#093525] transition-all duration-300 ${isCollapsed ? "px-2 pb-6" : ""}`}>
      {/* Role badge */}
      {!isCollapsed && (
        <div className={`mb-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[10.5px] font-bold uppercase tracking-[0.1em] shadow-sm ${roleConfig.bg}`}>
          <RoleIcon className="h-3.5 w-3.5 flex-shrink-0" />
          {roleConfig.label}
          {user?.is_owner && (
            <span className="ml-auto text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-md border border-amber-600 shadow-sm">
              YOU
            </span>
          )}
        </div>
      )}

      {/* User row */}
      <div 
        title={isCollapsed ? `${user?.full_name ?? user?.email} (${roleConfig.label})` : undefined}
        className={`flex items-center gap-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer group relative ${isCollapsed ? "justify-center p-1.5" : "p-2.5"}`}
      >
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner ring-2 ring-[#082f22]">
          <span className="text-[13px] font-bold text-white tracking-widest">{initials}</span>
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-white truncate tracking-wide">
              {user?.full_name ?? user?.email ?? "User"}
            </p>
            <p className="text-[11.5px] font-medium text-emerald-100/60 truncate mt-0.5">{user?.email}</p>
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); handleLogout?.() }}
          title="Sign out"
          className={`p-2 hover:text-rose-400 hover:bg-rose-500/20 text-emerald-200/50 rounded-lg transition-all border border-transparent ${
            isCollapsed 
              ? "absolute -top-12 left-1/2 -translate-x-1/2 bg-[#093525] opacity-0 group-hover:opacity-100 shadow-xl border-rose-500/20 z-50" 
              : "opacity-0 group-hover:opacity-100 absolute right-2"
          }`}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
