"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Building2,
  Shield,
  Mail,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

import { validateInvite, acceptInvite, type ValidateInviteResult } from "@/lib/auth.service"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

const PASSWORD_RULES = [
  { id: "length", text: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "upper", text: "1 uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", text: "1 number", test: (v: string) => /[0-9]/.test(v) },
  { id: "special", text: "1 special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { login } = useAuthStore()

  const [isValidating, setIsValidating] = useState(true)
  const [inviteData, setInviteData] = useState<ValidateInviteResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [form, setForm] = useState({ fullName: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldError, setFieldError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Validate token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        setIsValidating(true)
        const res = await validateInvite(params.token)
        if (res.valid) {
          setInviteData(res)
        } else {
          setValidationError(res.error || "This invitation link is invalid or has expired.")
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Unable to verify invitation link. Please check your network connection."
        setValidationError(msg)
      } finally {
        setIsValidating(false)
      }
    }

    if (params?.token) {
      checkToken()
    } else {
      setValidationError("Missing invitation token.")
      setIsValidating(false)
    }
  }, [params.token])

  const passwordMeetsAllRules = PASSWORD_RULES.every((r) => r.test(form.password))
  const passwordsMatch = form.password === form.confirmPassword && form.password.length > 0

  const setFormValue = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError("")
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError("")

    if (!form.fullName.trim()) {
      setFieldError("Please enter your full name.")
      return
    }

    if (!passwordMeetsAllRules) {
      setFieldError("Please meet all password requirements.")
      return
    }

    if (form.password !== form.confirmPassword) {
      setFieldError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const { access_token } = await acceptInvite({
        token: params.token,
        full_name: form.fullName.trim(),
        password: form.password,
      })
      await login(access_token)
      toast.success("Account activated successfully! Welcome aboard.")
      router.push("/dashboard")
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Invalid or expired invitation link."
      setFieldError(String(msg))
    } finally {
      setIsLoading(false)
    }
  }

  // 1. Loading State
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Verifying Invitation...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Validating security token and organization credentials.
          </p>
        </motion.div>
      </div>
    )
  }

  // 2. Error / Expired State
  if (validationError || !inviteData) {
    const isAlreadyAccepted = validationError?.toLowerCase().includes("already been accepted")
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-white/10 shadow-xl text-center space-y-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Invitation Issue
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {validationError || "This invitation link is not valid."}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            {isAlreadyAccepted ? (
              <Link href="/login" className="block">
                <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
                  Sign In to Your Account
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full h-11 border-slate-200 dark:border-white/10">
                  Return to Sign In
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // 3. Valid Invitation Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-200/60 dark:border-white/10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 mb-4 border border-emerald-100 dark:border-emerald-800/40 shadow-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Join {inviteData.org_name || "Data Insight"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            You&apos;ve been invited to join as an{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {inviteData.role}
            </span>
            . Complete your profile setup to activate your account.
          </p>
        </div>

        {/* Invited Org & Email Badge */}
        <div className="mb-6 p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Organization:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {inviteData.org_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Invited Email:
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {inviteData.email}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="fullName"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={setFormValue("fullName")}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. Jane Doe"
              className={cn(
                "h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 transition-all duration-200",
                focusedField === "fullName" &&
                  "border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm"
              )}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Set Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={setFormValue("password")}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                className={cn(
                  "h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 pr-10 transition-all duration-200",
                  focusedField === "password" &&
                    "border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Live Password Rules */}
            <AnimatePresence>
              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2 grid grid-cols-2 gap-y-1.5 gap-x-3"
                >
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(form.password)
                    return (
                      <div key={rule.id} className="flex items-center gap-1.5 text-xs">
                        {passed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span
                          className={cn(
                            passed
                              ? "text-slate-700 dark:text-slate-300 font-medium"
                              : "text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {rule.text}
                        </span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={form.confirmPassword}
              onChange={setFormValue("confirmPassword")}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              className={cn(
                "h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 transition-all duration-200",
                focusedField === "confirmPassword" &&
                  "border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm"
              )}
            />
            {form.confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-rose-500 mt-1">Passwords do not match.</p>
            )}
          </div>

          {/* Field Error Alert */}
          <AnimatePresence>
            {fieldError && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fieldError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-3">
            <Button
              type="submit"
              disabled={isLoading || (form.password.length > 0 && !passwordMeetsAllRules) || !passwordsMatch}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold gap-2 shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                <>
                  Complete Setup &amp; Join <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
