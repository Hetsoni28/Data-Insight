"use client"
import Link from "next/link"
import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, EyeOff, Loader2, CheckCircle2, Mail, ArrowRight, Check, X,
  Building2, User2, AlertCircle, ArrowLeft, Crown
} from "lucide-react"
import { toast } from "sonner"
import { registerUser, verifyEmailOTP, resendOTP } from "@/lib/auth.service"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

type AccountType = "individual" | "organization"
type Step = "choose-type" | "register" | "verify"

const ACCOUNT_TYPES = [
  {
    type: "individual" as AccountType,
    icon: User2,
    title: "Individual",
    subtitle: "Personal account for solo users",
    badge: "Viewer",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-50/80",
    badgeBg: "bg-blue-100 text-blue-700",
  },
  {
    type: "organization" as AccountType,
    icon: Building2,
    title: "Organization",
    subtitle: "For teams, companies & enterprises",
    badge: "Org Admin",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    selectedBorder: "border-[#10B981]",
    selectedBg: "bg-emerald-50/80",
    badgeBg: "bg-emerald-100 text-emerald-700",
  },
]

const PASSWORD_RULES = [
  { id: "length",  text: "At least 8 characters",   test: (v: string) => v.length >= 8 },
  { id: "upper",   text: "1 uppercase letter",        test: (v: string) => /[A-Z]/.test(v) },
  { id: "number",  text: "1 number",                  test: (v: string) => /[0-9]/.test(v) },
  { id: "special", text: "1 special character",       test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export function RegisterForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [step, setStep] = useState<Step>("choose-type")
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [fieldError, setFieldError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const [form, setForm] = useState({ name: "", email: "", password: "", orgName: "" })
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const passwordMeetsAllRules = PASSWORD_RULES.every(r => r.test(form.password))

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCountdown > 0) timer = setInterval(() => setResendCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCountdown])

  const setFormValue = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError("")
    setForm(p => ({ ...p, [key]: e.target.value }))
  }

  // ── Step 1: Choose account type ──────────────────────────────────────────
  const handleChooseType = (type: AccountType) => {
    setAccountType(type)
    setStep("register")
    setFieldError("")
  }

  // ── Step 2: Register ─────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError("")

    if (!passwordMeetsAllRules) {
      setFieldError("Please meet all password requirements.")
      return
    }
    if (accountType === "organization" && !form.orgName.trim()) {
      setFieldError("Organization name is required.")
      return
    }

    setIsLoading(true)
    try {
      await registerUser({
        email: form.email,
        password: form.password,
        full_name: form.name || undefined,
        account_type: accountType!,
        org_name: accountType === "organization" ? form.orgName : undefined,
      })

      toast.success("Account created! Check your email for the verification code.")
      setResendCountdown(60)
      setStep("verify")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Registration failed. Please try again."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 3: Verify OTP ───────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError("")

    const otp = otpValues.join("")
    if (otp.length !== 6) {
      setFieldError("Please enter the full 6-digit code.")
      return
    }

    setIsLoading(true)
    try {
      const { access_token } = await verifyEmailOTP({ email: form.email, otp })
      await login(access_token)
      toast.success("Email verified! Welcome to Data Insight 🎉")
      router.push("/onboarding")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Invalid or expired code."
      setFieldError(msg)
      setOtpValues(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0) return
    setIsResending(true)
    try {
      await resendOTP({ email: form.email })
      toast.success("A new verification code has been sent.")
      setResendCountdown(60)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      toast.error(axiosErr.response?.data?.message ?? "Failed to resend code.")
    } finally {
      setIsResending(false)
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    if (!/^[0-9]*$/.test(val)) return
    const newOtp = [...otpValues]
    newOtp[index] = val
    setOtpValues(newOtp)
    if (val !== "" && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otpValues[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6)
    if (pasted) {
      const newOtp = [...otpValues]
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i]
      setOtpValues(newOtp)
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ── STEP 1: Choose Type ─────────────────────────────────────────── */}
        {step === "choose-type" && (
          <motion.div
            key="choose-type"
            initial="hidden" animate="visible" exit={{ opacity: 0, x: -20 }}
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            <motion.div variants={item} className="space-y-1 mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
              <p className="text-sm text-slate-500">Choose how you want to use Data Insight</p>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-1 gap-4 mb-6">
              {ACCOUNT_TYPES.map(({ type, icon: Icon, title, subtitle, badge, color, border, selectedBorder, selectedBg, badgeBg }) => (
                <motion.button
                  key={type}
                  type="button"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleChooseType(type)}
                  className={cn(
                    "relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group",
                    "bg-white hover:shadow-md",
                    border,
                    "hover:border-opacity-70"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                      color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[15px] font-semibold text-slate-900">{title}</span>
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", badgeBg)}>
                          {badge}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500">{subtitle}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Owner note */}
            <motion.div variants={item} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <Crown className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">Platform Owner?</span>{" "}
                The owner account is managed by the platform administrator and cannot be created here.{" "}
                <Link href="/login" className="font-semibold underline hover:no-underline">Sign in instead →</Link>
              </p>
            </motion.div>

            <motion.p variants={item} className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#10B981] font-semibold hover:text-[#059669] transition-colors">
                Sign in <span aria-hidden="true">&rarr;</span>
              </Link>
            </motion.p>
          </motion.div>
        )}

        {/* ── STEP 2: Register Form ────────────────────────────────────────── */}
        {step === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
          >
            {/* Back + header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => { setStep("choose-type"); setFieldError("") }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {accountType === "organization" ? "Create your organization" : "Create your account"}
                </h1>
                <p className="text-sm text-slate-500">
                  {accountType === "organization"
                    ? "You'll be the admin of your organization"
                    : "Start your 14-day free trial — no card required"}
                </p>
              </div>
            </div>

            {/* Account type badge */}
            <div className="mb-5">
              {(() => {
                const found = ACCOUNT_TYPES.find(t => t.type === accountType)
                if (!found) return null
                return (
                  <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", found.badgeBg)}>
                    <found.icon className="h-3.5 w-3.5" />
                    {found.title} Account · Role: <span className="font-bold">{found.badge}</span>
                  </div>
                )
              })()}
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Organization fields */}
              {accountType === "organization" && (
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-sm font-semibold text-slate-700">
                    Organization name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="orgName" required={accountType === "organization"}
                      value={form.orgName} onChange={setFormValue("orgName")}
                      onFocus={() => setFocusedField("orgName")} onBlur={() => setFocusedField(null)}
                      placeholder="Acme Corp"
                      className={cn(
                        "h-11 bg-white border-slate-200 pl-9 transition-all duration-300",
                        focusedField === "orgName" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                      )}
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              )}

              {/* Full name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Full name {accountType === "individual" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="name" required={accountType === "individual"}
                  value={form.name} onChange={setFormValue("name")}
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                  placeholder="Your full name"
                  className={cn(
                    "h-11 bg-white border-slate-200 transition-all duration-300",
                    focusedField === "name" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                  )}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Work email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email" type="email" required
                  value={form.email} onChange={setFormValue("email")}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  placeholder="you@company.com"
                  className={cn(
                    "h-11 bg-white border-slate-200 transition-all duration-300",
                    focusedField === "email" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                  )}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? "text" : "password"} required
                    value={form.password} onChange={setFormValue("password")}
                    onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={cn(
                      "h-11 bg-white border-slate-200 pr-10 transition-all duration-300",
                      focusedField === "password" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                    )}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength checklist */}
                <AnimatePresence>
                  {form.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="pt-2 grid grid-cols-2 gap-y-1.5 gap-x-4"
                    >
                      {PASSWORD_RULES.map(rule => {
                        const passed = rule.test(form.password)
                        return (
                          <div key={rule.id} className="flex items-center gap-1.5 text-xs">
                            {passed
                              ? <Check className="h-3.5 w-3.5 text-[#10B981]" />
                              : <X className="h-3.5 w-3.5 text-slate-300" />}
                            <span className={cn(passed ? "text-slate-700" : "text-slate-400")}>{rule.text}</span>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error */}
              <AnimatePresence>
                {fieldError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {fieldError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
                <Button
                  type="submit"
                  disabled={isLoading || (form.password.length > 0 && !passwordMeetsAllRules)}
                  className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold gap-2 shadow-sm shadow-[#10B981]/20 transition-all"
                >
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</>
                    : <>Create account <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </motion.div>

              <p className="text-[11px] text-center text-slate-400">
                By creating an account you agree to our{" "}
                <a href="/terms" className="text-[#10B981] hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#10B981] hover:underline">Privacy Policy</a>.
              </p>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#10B981] font-semibold hover:text-[#059669] transition-colors">
                Sign in <span aria-hidden="true">&rarr;</span>
              </Link>
            </p>
          </motion.div>
        )}

        {/* ── STEP 3: Verify Email ─────────────────────────────────────────── */}
        {step === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="space-y-8 py-4"
          >
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                <Mail className="h-7 w-7 text-[#10B981]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Check your email</h1>
              <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                We sent a 6-digit verification code to <br />
                <span className="font-semibold text-slate-900">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-slate-700 text-center block">
                  Enter verification code
                </Label>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <Input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onFocus={() => setFocusedField(`otp-${i}`)}
                      onBlur={() => setFocusedField(null)}
                      suppressHydrationWarning
                      className={cn(
                        "w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold bg-white border-slate-200 transition-all duration-300 rounded-xl",
                        focusedField === `otp-${i}` && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                      )}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {fieldError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mx-auto max-w-[260px]">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {fieldError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit" disabled={isLoading || otpValues.join("").length !== 6}
                  className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold gap-2 shadow-sm shadow-[#10B981]/20 transition-all text-base"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify Account <ArrowRight className="h-5 w-5" /></>}
                </Button>
              </motion.div>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Didn&apos;t receive the code?{" "}
                {resendCountdown > 0 ? (
                  <span className="text-slate-400">Resend in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button" onClick={handleResend} disabled={isResending}
                    className="text-[#10B981] font-semibold hover:text-[#059669] transition-colors disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Click to resend"}
                  </button>
                )}
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
