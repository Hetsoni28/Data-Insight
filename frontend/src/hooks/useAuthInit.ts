/**
 * useAuthInit — Runs once on app mount.
 * If a persisted token exists in Zustand, re-fetches /auth/me
 * so the user profile is always fresh (not stale from localStorage).
 */
"use client"
import { useEffect, useRef } from "react"
import { useAuthStore } from "@/store/authStore"

export function useAuthInit() {
  const token = useAuthStore((s) => s.token)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const logout = useAuthStore((s) => s.logout)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!token || hasFetched.current) return
    hasFetched.current = true

    // Sync token to localStorage for Axios interceptor
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token)
    }

    // Re-fetch profile — if 401 the Axios interceptor will call logout
    fetchMe().catch(() => logout())
  }, [token, fetchMe, logout])
}
