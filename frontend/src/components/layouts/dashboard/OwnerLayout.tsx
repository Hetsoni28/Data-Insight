"use client"
import DashboardSidebar from "@/components/layouts/dashboard/DashboardSidebar"
import DashboardNavbar from "@/components/layouts/dashboard/DashboardNavbar"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useRouter } from "next/navigation"

import { 
  LayoutDashboard, Users, Building, Database, Brain, FileSpreadsheet, Receipt, 
  Settings, Activity, User, CreditCard, PieChart, Code, HardDrive, ShieldCheck, 
  LifeBuoy, Bell, ToggleLeft, Cpu, ActivitySquare, Link, Zap, LayoutTemplate, Palette, Filter
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
      { icon: HardDrive, label: "Upload Dataset", href: "/owner/dashboard/upload-dataset" },
      { icon: LayoutTemplate, label: "Dashboard Builder", href: "/owner/dashboard/builder" },
      { icon: PieChart, label: "Charts", href: "/owner/dashboard/charts" },
      { icon: FileSpreadsheet, label: "Reports", href: "/owner/dashboard/reports" },
      { icon: ActivitySquare, label: "Monitoring", href: "/owner/dashboard/monitoring" },
      { icon: Brain, label: "AI Copilot", href: "/owner/dashboard/ai" },
    ]
  },
  {
    title: "Management",
    items: [
      { icon: Building, label: "Organizations", href: "/owner/dashboard/organizations" },
      { icon: Filter, label: "Leads Pipeline", href: "/owner/dashboard/leads" },
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
  const router = useRouter()
  const { workspaces, activeWs, loadingWs, setWorkspaces, setActiveWs, setLoadingWs } = useWorkspaceStore()

  // Cache workspaces for 5 minutes — no re-fetch on every route change
  const { data: workspaceData, isLoading: wsLoading } = useQuery({
    queryKey: ["workspaces", user?.tenant_id],
    queryFn: () => api.get("/workspaces").then((r) => r.data),
    enabled: !!user?.tenant_id,
    staleTime: 5 * 60 * 1000,  // 5 minutes — serve from cache on navigation
    gcTime: 10 * 60 * 1000,
  })

  // Sync React Query result into Zustand workspace store
  useEffect(() => {
    setLoadingWs(wsLoading)
    if (workspaceData && workspaceData.length > 0) {
      setWorkspaces(workspaceData)
      const currentActive = useWorkspaceStore.getState().activeWs
      const stillExists = currentActive && workspaceData.find((w: any) => w.id === currentActive.id)
      if (!stillExists) {
        setActiveWs(workspaceData[0])
      }
    } else if (workspaceData) {
      setWorkspaces([])
      setActiveWs(null)
    }
  }, [workspaceData, wsLoading, setWorkspaces, setActiveWs, setLoadingWs])

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
        <DashboardNavbar onUploadClick={() => router.push('/owner/dashboard/upload-dataset')} showUploadButton={true} />
        <main className="flex-1 overflow-y-auto relative z-0 bg-slate-50/50 dark:bg-background transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  )
}
