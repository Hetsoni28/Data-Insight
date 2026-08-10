"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useAuth } from "@/hooks/useAuth"

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/onboarding",
]

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
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-white/5 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Authenticating...</p>
      </div>
    )
  }

  // 3. If token exists but is invalid (isError)
  if (token && isError) {
    // If the token was invalid (401), the hook clears it and the effect above will redirect.
    // But if it's a 500 or Network Error, the token remains. We shouldn't show a blank white page!
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-white/5 gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Unable to Connect</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          We could not reach the server to verify your session. Please check your internet connection and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // 4. If token exists, fetch succeeded, and we are on a public route -> Show nothing while redirecting
  if (token && isSuccess && isPublicRoute) {
    return null
  }

  // 5. Success! Render the application
  return <>{children}</>
}
