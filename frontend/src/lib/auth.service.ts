/**
 * auth.service.ts
 * Strongly-typed wrappers around the /auth API endpoints.
 */
import api from "@/lib/api"
import type { User, AuthTokens } from "@/types"

export interface RegisterPayload {
  email: string
  password: string
  full_name?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface VerifyEmailPayload {
  email: string
  otp: string
}

export interface ResendOTPPayload {
  email: string
}

/** POST /auth/register → returns { message } */
export async function registerUser(payload: RegisterPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/register", payload)
  return data
}

/** POST /auth/verify-email → returns { access_token, token_type } */
export async function verifyEmailOTP(payload: VerifyEmailPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/verify-email", payload)
  return data
}

/** POST /auth/resend-otp → returns { message } */
export async function resendOTP(payload: ResendOTPPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/resend-otp", payload)
  return data
}

/** POST /auth/login → returns { access_token, token_type } */
export async function loginUser(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/login", payload)
  return data
}

/** GET /auth/me → returns the current user's profile */
export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me")
  return data
}

/** POST /auth/logout */
export async function logoutUser(): Promise<void> {
  await api.post("/auth/logout")
}
