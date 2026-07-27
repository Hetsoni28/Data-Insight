"use client"
import { useRouter } from "next/navigation"
import { ShieldCheck, Users, Building2, CreditCard, Settings, LogOut } from "lucide-react"

const ADMIN_NAV = [
  { icon: ShieldCheck, label: "Admin Overview", href: "/admin",          active: true  },
  { icon: Building2,   label: "Tenants",        href: "/admin/tenants",  active: false },
  { icon: Users,       label: "Users",          href: "/admin/users",    active: false },
  { icon: CreditCard,  label: "Billing",        href: "/admin/billing",  active: false },
  { icon: Settings,    label: "Settings",       href: "/admin/settings", active: false },
]

interface AdminSidebarProps {
  user?: any
  handleLogout?: () => void
}

export default function Sidebar({ user, handleLogout }: AdminSidebarProps) {
  const router = useRouter()
  
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "A"

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Admin Console</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Management</p>
        {ADMIN_NAV.map(({ icon: Icon, label, href, active }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-indigo-500/10 text-indigo-400 font-medium"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom — user + logout */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-default">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {user?.full_name ?? user?.email ?? "Admin"}
            </p>
            <p className="text-[10px] text-indigo-400 font-medium">Super Admin</p>
          </div>
          <button onClick={handleLogout} title="Sign out" className="p-1 hover:text-red-400 text-slate-500 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
