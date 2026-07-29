/**
 * authStore — Global auth state with Zustand + persistence.
 * Stores ONLY the JWT token. The user profile is managed by React Query.
 * Token is also synced to localStorage for the Axios interceptor.
 */
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  /** Raw JWT access token */
  token: string | null

  /** Called immediately after login/register */
  login: (token: string) => void
  /** Clear all auth state */
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,

      login: (token: string) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token)
          document.cookie = `access_token=${token}; path=/; max-age=604800; samesite=lax`
        }
        set({ token })
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
        set({ token: null })
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      },
    }),
    {
      name: "auth-storage-v2",
    }
  )
)

