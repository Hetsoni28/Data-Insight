import { useRouter, usePathname } from "next/navigation"
import { NavGroup } from "@/components/layouts/dashboard/DashboardSidebar"

interface SidebarNavProps {
  navGroups: NavGroup[]
  isCollapsed?: boolean
}

export function SidebarNav({ navGroups, isCollapsed = false }: SidebarNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Find the best match (longest href that the pathname starts with)
  const allItems = navGroups.flatMap(g => g.items)
  let bestMatch = ""
  for (const item of allItems) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      if (item.href.length > bestMatch.length) {
        bestMatch = item.href
      }
    }
  }

  return (
    <nav className={`flex-1 space-y-6 overflow-y-auto custom-scrollbar relative z-10 pb-6 transition-all duration-300 ${isCollapsed ? "px-2" : "px-3"}`}>
      {navGroups.map((group) => (
        <div key={group.title} className="space-y-2">
          {!isCollapsed && (
            <h4 className="px-3 text-[11px] font-bold text-emerald-100/60 uppercase tracking-[0.15em] transition-opacity duration-300">
              {group.title}
            </h4>
          )}
          <div className="space-y-1">
            {group.items.map(({ icon: Icon, label, href }) => {
              const isActive = href === bestMatch
              return (
                <button
                  key={label}
                  onClick={() => router.push(href)}
                  suppressHydrationWarning
                  title={isCollapsed ? label : undefined}
                  className={`relative flex items-center gap-3 py-2.5 rounded-xl text-[13.5px] transition-all group ${
                    isCollapsed ? "justify-center w-full px-0" : "w-full px-3"
                  } ${
                    isActive ? "text-white bg-white/10 shadow-sm border-white/10 font-bold tracking-wide" : "text-emerald-50/70 hover:text-white hover:bg-white/5 border-transparent font-medium tracking-wide"
                  } border`}
                >
                  {/* Active glow line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                  )}
                  <Icon className={`h-[18px] w-[18px] flex-shrink-0 relative z-10 transition-colors ${isActive ? "text-emerald-300 drop-shadow-sm" : "text-emerald-200/60 group-hover:text-emerald-100"}`} />
                  {!isCollapsed && (
                    <span className="relative z-10 truncate">{label}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
