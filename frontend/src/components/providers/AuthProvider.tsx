"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useAuth } from "@/hooks/useAuth"

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { token } = useAuthStore()
  const { isLoading, isError, isSuccess } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  // eslint-disable-next-line
  useEffect(() => setMounted(true), [])

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/invite/")

  // Handle routing side effects safely in useEffect
  useEffect(() => {
    if (!mounted) return

    // If Zustand has a token but the cookie is missing, it means middleware cleared it
    if (token && !document.cookie.includes("access_token=")) {
      useAuthStore.getState().logout()
      return
    }

    if (!token && !isPublicRoute) {
      router.push("/login")
    } else if (token && isSuccess && isPublicRoute) {
      router.push("/dashboard")
    }
  }, [token, isPublicRoute, isSuccess, mounted, router])

  // If we haven't mounted yet, render nothing to prevent hydration mismatch
  if (!mounted) return null

  // 1. If no token and not on a public route -> Show nothing while redirecting
  if (!token && !isPublicRoute) {
    return null
  }

  // 2. If token exists and we are fetching user data -> Show Full Screen Loader
  // This completely prevents dashboard flickering!
  if (token && isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-500 font-medium animate-pulse">Authenticating...</p>
      </div>
    )
  }

  // 3. If token exists but is invalid (isError) -> The useAuth hook will clear the token and this component will redirect on the next render
  if (token && isError) {
    return null
  }

  // 4. If token exists, fetch succeeded, and we are on a public route -> Show nothing while redirecting
  if (token && isSuccess && isPublicRoute) {
    return null
  }

  // 5. Success! Render the application
  return <>{children}</>
}
