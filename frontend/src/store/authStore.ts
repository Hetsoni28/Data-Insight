/**
 * authStore — Global auth state with Zustand + persistence.
 * Manages access_token, refresh_token, and user authentication state.
 * Tokens are synchronized with localStorage and cookies for seamless SSR/Axios integration.
 */
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  /** Raw JWT access token */
  token: string | null
  /** Refresh token for seamless rotation */
  refreshToken: string | null

  /** Called immediately after login / token rotation */
  login: (accessToken: string, refreshToken?: string | null) => void
  /** Update refresh token after rotation */
  setTokens: (accessToken: string, refreshToken: string) => void
  /** Clear all auth state and redirect */
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,

      login: (accessToken: string, refreshToken?: string | null) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken)
          document.cookie = `access_token=${accessToken}; path=/; max-age=604800; samesite=lax`
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken)
          }
        }
        set({ token: accessToken, refreshToken: refreshToken || null })
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken)
          localStorage.setItem("refresh_token", refreshToken)
          document.cookie = `access_token=${accessToken}; path=/; max-age=604800; samesite=lax`
        }
        set({ token: accessToken, refreshToken })
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
        set({ token: null, refreshToken: null })
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      },
    }),
    {
      name: "auth-storage-v3",
    }
  )
)
