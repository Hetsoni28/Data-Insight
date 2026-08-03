/**
 * auth.service.ts
 * Strongly-typed wrappers around the /auth API endpoints.
 */
import api from "@/lib/api"
import type { User, AuthTokens } from "@/types"

export interface AcceptInvitePayload {
  token: string
  full_name: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RequestAccessPayload {
  email: string
  password: string
  full_name: string
  requested_role: string
}

export interface VerifyLoginPayload {
  email: string
  password: string
  otp: string
}

export interface VerifyEmailPayload {
  email: string
  otp: string
}

export interface ResendOTPPayload {
  email: string
}

/** POST /auth/accept-invite → returns { access_token, token_type } */
export async function acceptInvite(payload: AcceptInvitePayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/accept-invite", payload)
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

/** POST /auth/login → returns { message } */
export async function loginUser(payload: LoginPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/login", payload)
  return data
}

/** POST /auth/request-access → returns { message } */
export async function requestAccess(payload: RequestAccessPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/request-access", payload)
  return data
}

/** POST /auth/verify-login → returns { access_token, token_type } */
export async function verifyLogin(payload: VerifyLoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/verify-login", payload)
  return data
}

/** GET /auth/me → returns the current user's profile */
export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me")
  return data
}

/** POST /auth/forgot-password → sends reset OTP */
export async function requestPasswordReset(payload: { email: string }): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", payload)
  return data
}

/** POST /auth/reset-password → resets password with OTP */
export async function resetPassword(payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", payload)
  return data
}

/** POST /auth/logout */
export async function logoutUser(): Promise<void> {
  await api.post("/auth/logout")
}
