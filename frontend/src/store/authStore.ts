/**
 * authStore — Global auth state with Zustand + persistence.
 * Stores the JWT token and full user profile.
 * Token is also synced to localStorage for the Axios interceptor.
 */
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

interface AuthState {
  /** Raw JWT access token */
  token: string | null
  /** Full user profile from /auth/me */
  user: User | null
  /** True while fetchMe is in flight */
  isLoading: boolean

  /** Called immediately after login/register — stores token + fetches profile */
  login: (token: string) => Promise<void>
  /** Clear all auth state */
  logout: () => void
  /** Re-fetch the user profile (e.g. after plan upgrade) */
  fetchMe: () => Promise<void>
  /** Direct setter used by login helper */
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,

      login: async (token: string) => {
        // 1. Persist token immediately for Axios interceptor
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token)
        }
        set({ token, isLoading: true })

        // 2. Fetch full profile from /auth/me
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          })
          if (res.ok) {
            const user: User = await res.json()
            set({ user, isLoading: false })
          } else {
            // Token valid but profile fetch failed — still log in with token
            set({ isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      },

      fetchMe: async () => {
        const token = get().token
        if (!token) return
        set({ isLoading: true })
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          })
          if (res.ok) {
            const user: User = await res.json()
            set({ user })
          } else if (res.status === 401) {
            // Throw so AuthInitializer can catch and logout
            throw new Error("Unauthorized")
          }
        } catch (err) {
          throw err
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
        }
        set({ token: null, user: null })
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      },

      setUser: (user: User) => set({ user }),
    }),
    {
      name: "auth-storage-v2",
      // Only persist token — user profile is always re-fetched on mount
      partialize: (state) => ({ token: state.token }),
    }
  )
)
