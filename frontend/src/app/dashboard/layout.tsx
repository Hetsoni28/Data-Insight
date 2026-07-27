"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import type { Workspace } from "@/types"

import DashboardSidebar from "./sidebar/page"
import DashboardNavbar from "./navbar/page"
import { UploadDatasetModal } from "@/components/organisms/UploadDatasetModal"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { 
    workspaces, activeWs, loadingWs, isUploadOpen, 
    setWorkspaces, setActiveWs, setLoadingWs, setIsUploadOpen 
  } = useWorkspaceStore()

  // Fetch workspaces on mount
  useEffect(() => {
    if (!user?.tenant_id) {
      setLoadingWs(false)
      return
    }
    api.get<Workspace[]>("/workspaces")
      .then(({ data }) => {
        setWorkspaces(data)
        if (data.length > 0 && !activeWs) setActiveWs(data[0])
      })
      .catch(() => toast.error("Could not load workspaces."))
      .finally(() => setLoadingWs(false))
  }, [user?.tenant_id, activeWs, setWorkspaces, setActiveWs, setLoadingWs])

  const handleLogout = async () => {
    try { await api.post("/auth/logout") } catch { /* ignore */ }
    logout()
    router.push("/login")
  }

  const handleUploadSuccess = () => {
    window.dispatchEvent(new Event("dataset-uploaded"))
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <DashboardSidebar
        user={user}
        workspaces={workspaces}
        activeWs={activeWs}
        loadingWs={loadingWs}
        handleLogout={handleLogout}
      />

      {/* ── Main Content Area ─────────────────────────────────────────── */}
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
