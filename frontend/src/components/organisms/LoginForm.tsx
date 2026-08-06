"use client"

import Link from "next/link"
import React, { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  KeyRound,
  Lock,
  Mail,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { loginUser, verifyLogin, requestAccess } from "@/lib/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

export function LoginForm({ defaultMode = "login" }: { defaultMode?: "login" | "request" } = {}) {
  const router = useRouter()
  const { login } = useAuthStore()
  
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [mode, setMode] = useState<"login" | "request">(defaultMode)
  const [loginStep, setLoginStep] = useState<1 | 2>(1)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    full_name: "", 
    requested_role: "tenant_admin" 
  })
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [fieldError, setFieldError] = useState("")

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  }, [form.email])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFieldError("")
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "")
    if (!sanitized && value !== "") return

    const newDigits = [...otpDigits]
    newDigits[index] = sanitized.slice(-1)
    setOtpDigits(newDigits)
    setFieldError("")

    if (sanitized && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""))
      otpRefs.current[5]?.focus()
    }
  }

  const fullOtpCode = otpDigits.join("")

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) {
      setFieldError("Please enter a valid organization work email.")
      return
    }
    if (!form.password) {
      setFieldError("Please enter your account password.")
      return
    }
    setIsLoading(true)
    setFieldError("")

    try {
      const response = await loginUser({
        email: form.email,
        password: form.password,
      })
      toast.success(response.message || "2FA code sent to your email!")
      setLoginStep(2)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg =
        axiosErr.response?.data?.message ??
        "Authentication failed. Please verify your tenant credentials."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fullOtpCode.length !== 6) {
      setFieldError("Security code must be exactly 6 digits.")
      return
    }
    setIsLoading(true)
    setFieldError("")

    try {
      const { access_token } = await verifyLogin({
        email: form.email,
        password: form.password,
        otp: fullOtpCode
      })

      await login(access_token)
      toast.success("Authenticated to Private Tenant Node")
      router.push("/dashboard")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg =
        axiosErr.response?.data?.message ??
        "Invalid or expired verification code."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name) {
      setFieldError("Please enter your full name.")
      return
    }
    if (!isValidEmail) {
      setFieldError("Please enter your official work email.")
      return
    }
    if (!form.password || form.password.length < 8) {
      setFieldError("Password must be at least 8 characters.")
      return
    }
    setIsLoading(true)
    setFieldError("")

    try {
      await requestAccess({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        requested_role: form.requested_role
      })
      setRequestSuccess(true)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg =
        axiosErr.response?.data?.message ??
        "Failed to submit access request. Please try again."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      
      {/* ── MODE SWITCHER TABS ── */}
      <div className="p-1 rounded-xl bg-slate-200/80 grid grid-cols-2 text-xs font-semibold">
        <button
          onClick={() => {
            setMode("login")
            setFieldError("")
          }}
          className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
            mode === "login"
              ? "bg-white text-slate-950 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tenant Node Sign In
        </button>
        <button
          onClick={() => {
            setMode("request")
            setFieldError("")
          }}
          className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
            mode === "request"
              ? "bg-white text-slate-950 shadow-xs font-bold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Request Role Access
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "login" ? (
          /* ── MODE 1: SIGN IN TO TENANT NODE ── */
          <motion.div
            key="login-mode"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
                Enterprise Node Access
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your organization email & credentials to authenticate to your dedicated VPC instance.
              </p>
            </div>

            {fieldError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{fieldError}</span>
              </div>
            )}

            {loginStep === 1 ? (
              <form onSubmit={handleLoginStep1} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Organization Work Email</Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type="email"
                      placeholder="alex@company.com"
                      value={form.email}
                      onChange={set("email")}
                      className="pl-9 h-10 text-xs border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Account Password</Label>
                    <Link href="/forgot-password" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={set("password")}
                      className="pl-9 pr-9 h-10 text-xs border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Authenticate to Instance</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* 2FA Step 2 with 6 Individual Boxes */
              <form onSubmit={handleLoginStep2} className="space-y-5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Security code sent to <strong>{form.email}</strong></span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 block text-center">
                    Enter 6-Digit 2FA Code
                  </Label>
                  <div className="flex items-center justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpRefs.current[idx] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`w-12 h-13 text-center text-xl font-mono font-bold rounded-xl border transition-all outline-none ${
                          digit
                            ? "border-[#10B981] bg-emerald-50/50 text-slate-950 ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-slate-50 text-slate-900 focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || fullOtpCode.length !== 6}
                  className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Complete Sign In"}
                </Button>

                <button
                  type="button"
                  onClick={() => setLoginStep(1)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 pt-1 cursor-pointer"
                >
                  ← Back to Email & Password
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dedicated single-tenant infrastructure. Public self-serve signups are disabled.
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── MODE 2: REQUEST ROLE ACCESS ── */
          <motion.div
            key="request-mode"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            {requestSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Role Request Received</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Your role access request has been submitted. The organization administrator for <strong>{form.email}</strong> will review and grant access.
                </p>
                <Button
                  onClick={() => {
                    setRequestSuccess(false)
                    setMode("login")
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2 rounded-xl"
                >
                  Return to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
                    Request Account Role
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Request a specific user role for your organization&apos;s tenant workspace.
                  </p>
                </div>

                {fieldError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{fieldError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                    <Input
                      type="text"
                      placeholder="Jane Doe"
                      value={form.full_name}
                      onChange={set("full_name")}
                      className="h-10 text-xs border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Official Work Email</Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <Input
                        type="email"
                        placeholder="jane.doe@enterprise.com"
                        value={form.email}
                        onChange={set("email")}
                        className="pl-9 h-10 text-xs border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Desired Account Password</Label>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={set("password")}
                      className="h-10 text-xs border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Requested Account Role</Label>
                    <select
                      value={form.requested_role}
                      onChange={(e) => setForm((p) => ({ ...p, requested_role: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="viewer">Viewer (View Dashboards & Reports)</option>
                      <option value="analyst">Analyst (Data Modeling & Analysis)</option>
                      <option value="tenant_admin">Organization Admin (Full Tenant Access)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Role Request</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400">
                    Requests require approval from your Organization Admin.
                  </span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
