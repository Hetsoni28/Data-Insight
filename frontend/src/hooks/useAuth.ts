import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import type { User } from "@/types"

/**
 * Fetches the currently authenticated user from the backend.
 * Uses TanStack Query for caching, deduping, and automatic retries.
 *
 * Key behaviour:
 *  - If the token changes (e.g. after refresh-token or re-login) we invalidate
 *    the cached user immediately so that stale tenant_id / role data is never served.
 */
export function useAuth() {
  const { token, logout } = useAuthStore()
  const queryClient = useQueryClient()

  // Whenever the stored JWT changes, bust the cached /auth/me response so that
  // the next call gets a fresh user with the updated tenant_id + role.
  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const { data } = await api.get<User>("/auth/me")
        return data
      } catch (error: any) {
        // If the backend says unauthorized, the token is invalid or expired
        if (error.response?.status === 401) {
          logout()
        }
        throw error
      }
    },
    // Only run this query if we actually have a token
    enabled: !!token,
    // Do not retry 401 Unauthorized errors
    retry: (failureCount, error: any) => {
      if (error.response?.status === 401) return false
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // Consider user data fresh for 5 minutes
  })
}
