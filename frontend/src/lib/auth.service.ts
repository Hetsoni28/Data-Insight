/**
 * auth.service.ts
 * Strongly-typed wrappers around the Enterprise /auth API endpoints.
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

export interface LoginResponse {
  mfa_required: boolean
  mfa_token?: string
  access_token?: string
  refresh_token?: string
  token_type?: string
  user?: User
  message?: string
}

export interface VerifyMFAPayload {
  mfa_token: string
  code: string
}

export interface MFASetupResponse {
  secret: string
  qr_code_url: string
  recovery_codes: string[]
}

export interface UserSessionItem {
  id: string
  device_name: string
  os: string
  browser: string
  location: string
  country?: string
  city?: string
  ip_address: string
  user_agent?: string
  is_active: boolean
  is_current?: boolean
  expires_at: string
  last_active_at: string
  created_at: string
}

export interface LoginHistoryItem {
  id: string
  ip_address: string
  browser: string
  os: string
  device: string
  country: string
  city: string
  success: boolean
  failure_reason?: string
  created_at: string
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

export interface ValidateInviteResult {
  valid: boolean
  email?: string
  role?: string
  org_name?: string
  error?: string
}

/** GET /auth/invite/:token → validates token & returns org details */
export async function validateInvite(token: string): Promise<ValidateInviteResult> {
  const { data } = await api.get<ValidateInviteResult>(`/auth/invite/${token}`)
  return data
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

/** POST /auth/login → handles password auth, lockout checks, and MFA trigger */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload)
  return data
}

/** POST /auth/mfa/verify → validates TOTP or Recovery Code and completes login */
export async function verifyMFALogin(payload: VerifyMFAPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/mfa/verify", payload)
  return data
}

/** POST /auth/mfa/setup → initiates MFA setup, returns QR code & 10 recovery codes */
export async function setupMFA(): Promise<MFASetupResponse> {
  const { data } = await api.post<MFASetupResponse>("/auth/mfa/setup")
  return data
}

/** POST /auth/mfa/enable → activates MFA after verifying first code */
export async function enableMFA(code: string): Promise<{ message: string; recovery_codes: string[] }> {
  const { data } = await api.post<{ message: string; recovery_codes: string[] }>("/auth/mfa/enable", { code })
  return data
}

/** POST /auth/mfa/disable → deactivates MFA with password confirmation */
export async function disableMFA(password: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/mfa/disable", { password })
  return data
}

/** GET /auth/sessions → returns all active login sessions */
export async function getActiveSessions(): Promise<UserSessionItem[]> {
  const { data } = await api.get<UserSessionItem[]>("/auth/sessions")
  return data
}

/** DELETE /auth/sessions/:id → terminates a specific session */
export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/auth/sessions/${sessionId}`)
  return data
}

/** POST /auth/revoke-all-sessions → global logout / kills all user sessions */
export async function revokeAllSessions(): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/revoke-all-sessions")
  return data
}

/** GET /auth/login-history → returns audit trail of all logins and IP geolocations */
export async function getLoginHistory(): Promise<LoginHistoryItem[]> {
  const { data } = await api.get<LoginHistoryItem[]>("/auth/login-history")
  return data
}

/** POST /auth/request-access → returns { message } */
export async function requestAccess(payload: RequestAccessPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/request-access", payload)
  return data
}

/** POST /auth/verify-login → backward-compat email otp login */
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

/** POST /auth/deactivate */
export async function deactivateAccount(password: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>("/auth/deactivate", { password })
  return data
}
