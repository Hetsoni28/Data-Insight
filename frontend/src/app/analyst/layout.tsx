"use client"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { MemberLayout } from "@/components/layouts/dashboard/MemberLayout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { logout } = useAuthStore()
  // Data is guaranteed to exist here because AuthProvider handles the loading/error states
  const { data: user } = useAuth()

  const handleLogout = async () => {
    try { await api.post("/auth/logout") } catch { /* ignore */ }
    logout()
    router.push("/login")
  }

  // Strictly render Owner Layout
  return <MemberLayout user={user} handleLogout={handleLogout}>{children}</MemberLayout>
}



