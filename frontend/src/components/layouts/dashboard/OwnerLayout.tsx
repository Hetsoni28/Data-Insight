"use client"
import DashboardSidebar from "@/app/owner/dashboard/sidebar/page"
import DashboardNavbar from "@/app/owner/dashboard/navbar/page"
import { useEffect } from "react"
import api from "@/lib/api"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { UploadDatasetModal } from "@/components/organisms/UploadDatasetModal"

import { 
  LayoutDashboard, Users, Building, Database, Brain, FileSpreadsheet, Receipt, 
  Settings, Activity, User, CreditCard, PieChart, Code, HardDrive, ShieldCheck, 
  LifeBuoy, Bell, ToggleLeft, Cpu, ActivitySquare, Link, Zap, LayoutTemplate, Palette
} from "lucide-react"

export interface NavItem {
  icon: any;
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const OWNER_NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/owner/dashboard" },
      { icon: Database, label: "Datasets", href: "/owner/dashboard/datasets" },
      { icon: FileSpreadsheet, label: "Reports", href: "/owner/dashboard/reports" },
      { icon: ActivitySquare, label: "Monitoring", href: "/owner/dashboard/monitoring" },
      { icon: Brain, label: "AI Copilot", href: "/owner/dashboard/ai" },
    ]
  },
  {
    title: "Management",
    items: [
      { icon: Building, label: "Organizations", href: "/owner/dashboard/organizations" },
      { icon: Users, label: "Users", href: "/owner/dashboard/users" },
      { icon: CreditCard, label: "Subscriptions", href: "/owner/dashboard/subscriptions" },
    ]
  },
  {
    title: "Analytics",
    items: [
      { icon: Receipt, label: "Revenue", href: "/owner/dashboard/revenue" },
      { icon: Zap, label: "AI Usage", href: "/owner/dashboard/ai-usage" },
      { icon: PieChart, label: "Platform Analytics", href: "/owner/dashboard/analytics" },
    ]
  },
  {
    title: "Platform",
    items: [
      { icon: Code, label: "API Management", href: "/owner/dashboard/api" },
      { icon: HardDrive, label: "Storage", href: "/owner/dashboard/storage" },
      { icon: Brain, label: "AI Providers", href: "/owner/dashboard/ai-providers" },
      { icon: Link, label: "Integrations", href: "/owner/dashboard/integrations" },
    ]
  },
  {
    title: "Security & Ops",
    items: [
      { icon: ShieldCheck, label: "Security", href: "/owner/dashboard/security" },
      { icon: Activity, label: "Audit Logs", href: "/owner/dashboard/audit-logs" },
      { icon: ToggleLeft, label: "Feature Flags", href: "/owner/dashboard/feature-flags" },
    ]
  },
  {
    title: "Settings",
    items: [
      { icon: Palette, label: "Design System", href: "/owner/dashboard/design-system" },
      { icon: Bell, label: "Notifications", href: "/owner/dashboard/notifications" },
      { icon: LifeBuoy, label: "Support Center", href: "/owner/dashboard/support" },
      { icon: Settings, label: "System Settings", href: "/owner/dashboard/settings" },
      { icon: User, label: "Profile", href: "/owner/dashboard/profile" },
    ]
  }
]

interface OwnerLayoutProps {
  children: React.ReactNode
  user: any
  handleLogout: () => void
}

export function OwnerLayout({ children, user, handleLogout }: OwnerLayoutProps) {
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

  // Fallback: If workspaces are loaded but activeWs is not set (e.g. from onboarding state), auto-select it
  useEffect(() => {
    if (workspaces.length > 0 && !activeWs) {
      setActiveWs(workspaces[0])
    }
  }, [workspaces, activeWs, setActiveWs])

  const handleUploadSuccess = () => {
    window.dispatchEvent(new Event("dataset-uploaded"))
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <DashboardSidebar
        user={user}
        workspaces={workspaces}
        activeWs={activeWs}
        loadingWs={loadingWs}
        navGroups={OWNER_NAV_GROUPS}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <DashboardNavbar onUploadClick={() => setIsUploadOpen(true)} />
        <main className="flex-1 overflow-y-auto relative z-0">
          {children}
        </main>
      </div>

      {/* Always render modal so setIsUploadOpen works even before activeWs resolves */}
      <UploadDatasetModal 
        isOpen={isUploadOpen && !!activeWs} 
        onClose={() => setIsUploadOpen(false)} 
        workspaceId={activeWs?.id ?? ""}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
