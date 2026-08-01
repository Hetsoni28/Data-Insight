"use client"
import { Users, Database, LayoutDashboard, BarChart2, Brain, Settings, UploadCloud, LayoutTemplate, FileSpreadsheet, Activity, User, Receipt } from "lucide-react"
import DashboardSidebar, { NavItem } from "@/components/layouts/dashboard/DashboardSidebar"
import DashboardNavbar from "@/components/layouts/dashboard/DashboardNavbar"
import { useEffect } from "react"
import api from "@/lib/api"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { UploadDatasetModal } from "@/components/organisms/UploadDatasetModal"

const MEMBER_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", allowedRoles: ["organization-admin", "manager", "analyst", "viewer", "org_admin"] },
  
  { icon: Users, label: "Team Management", href: "/dashboard/team", allowedRoles: ["organization-admin", "org_admin"] },
  
  { icon: Database, label: "Datasets", href: "/dashboard/datasets", allowedRoles: ["organization-admin", "org_admin", "manager", "analyst", "viewer"] },
  { icon: UploadCloud, label: "Upload Dataset", href: "/dashboard/datasets/upload", allowedRoles: ["analyst"] },
  
  { icon: Brain, label: "AI Copilot", href: "/dashboard/ai", allowedRoles: ["organization-admin", "org_admin", "manager", "analyst"] },
  
  { icon: LayoutTemplate, label: "Dashboard Builder", href: "/dashboard/builder", allowedRoles: ["organization-admin", "org_admin", "manager", "analyst"] },
  
  { icon: BarChart2, label: "Charts", href: "/dashboard/charts", allowedRoles: ["analyst"] },
  
  { icon: FileSpreadsheet, label: "Reports", href: "/dashboard/reports", allowedRoles: ["organization-admin", "org_admin", "manager", "analyst", "viewer"] },
  
  { icon: Activity, label: "Analytics", href: "/dashboard/analytics", allowedRoles: ["manager", "viewer"] },
  
  { icon: Settings, label: "Org Settings", href: "/dashboard/settings", allowedRoles: ["organization-admin", "org_admin"] },
  { icon: Receipt, label: "Billing", href: "/dashboard/billing", allowedRoles: ["organization-admin", "org_admin"] },
  
  { icon: User, label: "Profile", href: "/dashboard/profile", allowedRoles: ["organization-admin", "org_admin", "manager", "analyst", "viewer"] },
]

interface MemberLayoutProps {
  children: React.ReactNode
  user: any
  handleLogout: () => void
}

export function MemberLayout({ children, user, handleLogout }: MemberLayoutProps) {
  const { workspaces, activeWs, loadingWs, isUploadOpen, setIsUploadOpen, setWorkspaces, setActiveWs, setLoadingWs } = useWorkspaceStore()

  useEffect(() => {
    if (user?.tenant_id) {
      setLoadingWs(true)
      api.get("/workspaces")
        .then(({ data }) => {
          setWorkspaces(data)
          const currentActive = useWorkspaceStore.getState().activeWs
          if (data && data.length > 0) {
            // Check if current active workspace is still in the fetched list
            const stillExists = currentActive && data.find((w: any) => w.id === currentActive.id)
            if (!stillExists) {
              setActiveWs(data[0])
            }
          } else {
            setActiveWs(null)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingWs(false))
    } else {
      setLoadingWs(false)
    }
  }, [user?.tenant_id, setWorkspaces, setActiveWs, setLoadingWs])

  // Fallback: If workspaces are loaded but activeWs is not set, auto-select it
  useEffect(() => {
    if (workspaces.length > 0 && !activeWs) {
      setActiveWs(workspaces[0])
    }
  }, [workspaces, activeWs, setActiveWs])

  const handleUploadSuccess = () => {
    window.dispatchEvent(new Event("dataset-uploaded"))
  }

  // Filter nav items based on the user's specific role (org_admin, manager, etc.)
  const navItems: NavItem[] = MEMBER_NAV.filter(item => 
    item.allowedRoles.includes(user?.role)
  ).map(({ icon, label, href }) => ({ icon, label, href }))

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-white/5 overflow-hidden">
      <DashboardSidebar
        user={user}
        workspaces={workspaces}
        activeWs={activeWs}
        loadingWs={loadingWs}
        navGroups={[{ title: "Menu", items: navItems }]}
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
