"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"

import AdminSidebar from "./sidebar/page"
import AdminNavbar from "./navbar/page"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuthStore()

  // Guard: Must be logged in
  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please log in to access the admin console.")
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const handleLogout = async () => {
    try { await api.post("/auth/logout") } catch { /* ignore */ }
    logout()
    router.push("/login")
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <AdminSidebar user={user} handleLogout={handleLogout} />

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
