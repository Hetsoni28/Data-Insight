"use client"
import { LayoutDashboard, Users, Building, Database, Brain, LayoutTemplate, FileSpreadsheet, Receipt, Settings, Activity, User } from "lucide-react"
import DashboardSidebar, { NavItem } from "@/app/owner/dashboard/sidebar/page"
import DashboardNavbar from "@/app/owner/dashboard/navbar/page"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { UploadDatasetModal } from "@/components/organisms/UploadDatasetModal"

const OWNER_NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: Building, label: "Organizations", href: "/dashboard/organizations" },
  { icon: Database, label: "Datasets", href: "/dashboard/datasets" },
  { icon: Brain, label: "AI Copilot", href: "/dashboard/ai" },
  { icon: LayoutTemplate, label: "Dashboard Builder", href: "/dashboard/builder" },
  { icon: FileSpreadsheet, label: "Reports", href: "/dashboard/reports" },
  { icon: Receipt, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: Activity, label: "Audit Logs", href: "/dashboard/audit-logs" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
]

interface OwnerLayoutProps {
  children: React.ReactNode
  user: any
  handleLogout: () => void
}

export function OwnerLayout({ children, user, handleLogout }: OwnerLayoutProps) {
  const { workspaces, activeWs, loadingWs, isUploadOpen, setIsUploadOpen } = useWorkspaceStore()

  const handleUploadSuccess = () => {
    window.dispatchEvent(new Event("dataset-uploaded"))
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <DashboardSidebar
        user={user}
        workspaces={workspaces}
        activeWs={activeWs}
        loadingWs={loadingWs}
        navItems={OWNER_NAV}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DashboardNavbar onUploadClick={() => setIsUploadOpen(true)} />
        <main className="flex-1 overflow-y-auto relative z-0">
          {children}
        </main>
      </div>

      {activeWs && (
        <UploadDatasetModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
          workspaceId={activeWs.id}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
}
