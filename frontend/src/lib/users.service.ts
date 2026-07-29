import api from "@/lib/api"
import type { User } from "@/types"

/** GET /users/pending → returns list of pending users */
export async function getPendingUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users/pending")
  return data
}

/** POST /users/:id/approve → approves the user */
export async function approveUser(userId: string): Promise<User> {
  const { data } = await api.post<User>(`/users/${userId}/approve`)
  return data
}

/** DELETE /users/:id/reject → rejects the user */
export async function rejectUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/reject`)
}

/** GET /users/active → returns list of approved/active users */
export async function getActiveUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users/active")
  return data
}

/** DELETE /users/:id/revoke → revokes an active user's access */
export async function revokeUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}/revoke`)
}
