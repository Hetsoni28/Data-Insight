"use client"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Mail, Building, Users, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"
import { loginUser, verifyLogin, requestAccess } from "@/lib/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuthStore()
  
  // Prevent hydration errors from browser extensions (like 1Password, Grammarly)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [mode, setMode] = useState<"login" | "request">("login")
  const [loginStep, setLoginStep] = useState<1 | 2>(1)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    otp: "", 
    full_name: "", 
    requested_role: "viewer" 
  })
  const [fieldError, setFieldError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  }, [form.email])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFieldError("")
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) {
      setFieldError("Please enter a valid email address.")
      return
    }
    if (!form.password) {
      setFieldError("Please enter your password.")
      return
    }
    setIsLoading(true)
    setFieldError("")

    try {
      const response = await loginUser({
        email: form.email,
        password: form.password,
      })
      toast.success(response.message || "Check your email for the code!")
      setLoginStep(2)
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg =
        axiosErr.response?.data?.message ??
        "Invalid email or password. Please try again."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.otp.length !== 6) {
      setFieldError("OTP must be exactly 6 digits.")
      return
    }
    setIsLoading(true)
    setFieldError("")

    try {
      const { access_token } = await verifyLogin({
        email: form.email,
        password: form.password,
        otp: form.otp
      })

      await login(access_token)
      toast.success("Welcome back! 👋")
      router.push("/dashboard")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg =
        axiosErr.response?.data?.message ??
        "Invalid or expired code. Please try again."
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
      setFieldError("Please enter a valid email address.")
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
        "An error occurred. Please try again."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[400px]">
        
        {/* Toggle Tabs */}
        {!requestSuccess && loginStep === 1 && (
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8 relative">
            <button
              onClick={() => { setMode("login"); setFieldError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors ${mode === "login" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("request"); setFieldError(""); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors ${mode === "request" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              Request Access
            </button>
            <motion.div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
              initial={false}
              animate={{ left: mode === "login" ? 4 : "50%" }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ─────────────────────────────────────────────────────────────
              REQUEST ACCESS SUCCESS STATE
             ───────────────────────────────────────────────────────────── */}
          {mode === "request" && requestSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Request Submitted</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Your access request has been sent to the Platform Owner for approval.
                  You will receive an email once your account has been activated.
                </p>
              </div>
              <Button 
                onClick={() => { setMode("login"); setRequestSuccess(false); setForm(p => ({...p, password: ""})); }}
                variant="outline" 
                className="w-full mt-4"
              >
                Return to Login
              </Button>
            </motion.div>
          ) : mode === "request" ? (
            <motion.div
              key="request"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* ─────────────────────────────────────────────────────────────
                  REQUEST ACCESS FORM
                 ───────────────────────────────────────────────────────────── */}
              <div className="space-y-1 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Join the team</h1>
                <p className="text-sm text-slate-500">Submit a request to access the workspace</p>
              </div>

              {mounted ? (
                <form onSubmit={handleRequestAccess} className="space-y-5" suppressHydrationWarning>
                  {/* Full Name */}
                  <div className="space-y-2 relative group">
                    <Label htmlFor="full_name" className="text-sm font-semibold text-slate-700">Full Name</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Jane Doe"
                      value={form.full_name}
                      onChange={set("full_name")}
                      onFocus={() => setFocusedField("full_name")}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2 relative group">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={set("email")}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2 relative group">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={set("password")}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Requested Role Dropdown */}
                  <div className="space-y-2 relative group">
                    <Label htmlFor="requested_role" className="text-sm font-semibold text-slate-700">Requested Role</Label>
                    <select
                      id="requested_role"
                      value={form.requested_role}
                      onChange={(e) => setForm(p => ({ ...p, requested_role: e.target.value }))}
                      disabled={isLoading}
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="analyst">Analyst</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {fieldError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium">{fieldError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={isLoading || (!isValidEmail && form.email.length > 0)}
                    className={cn(
                      "w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold gap-2 transition-all shadow-sm shadow-[#10B981]/20",
                      isLoading && "opacity-80"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Request Access <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="h-[250px] w-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              )}
            </motion.div>

          ) : loginStep === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* ─────────────────────────────────────────────────────────────
                  LOGIN STEP 1 (Credentials)
                 ───────────────────────────────────────────────────────────── */}
              <div className="space-y-1 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                <p className="text-sm text-slate-500">Sign in to your account to continue</p>
              </div>

              {mounted ? (
                <form onSubmit={handleLoginStep1} className="space-y-5" suppressHydrationWarning>
                  {/* Email */}
                  <div className="space-y-2 relative group">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={form.email}
                        onChange={set("email")}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        className={cn(
                          "h-11 pl-4 pr-10 rounded-xl transition-all duration-300",
                          focusedField === "email" ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "bg-slate-50/50 hover:bg-slate-50",
                          !focusedField && form.email && !isValidEmail ? "border-red-300 bg-red-50/30" : ""
                        )}
                      />
                      <AnimatePresence>
                        {form.email && isValidEmail && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                        Password
                      </Label>
                      <Link href="/forgot-password" tabIndex={-1} className="text-xs font-semibold text-[#10B981] hover:text-[#059669] transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={form.password}
                        onChange={set("password")}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        className={cn(
                          "h-11 pl-4 pr-10 rounded-xl transition-all duration-300",
                          focusedField === "password" ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "bg-slate-50/50 hover:bg-slate-50"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {fieldError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium">{fieldError}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-2">
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button
                        type="submit"
                        disabled={isLoading || (!isValidEmail && form.email.length > 0)}
                        className={cn(
                          "w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold gap-2 transition-all shadow-sm shadow-[#10B981]/20",
                          isLoading && "opacity-80"
                        )}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Sign in <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              ) : (
                <div className="h-[250px] w-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              )}
            </motion.div>

          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              {/* ─────────────────────────────────────────────────────────────
                  LOGIN STEP 2 (2FA OTP)
                 ───────────────────────────────────────────────────────────── */}
              <button
                onClick={() => {
                  setLoginStep(1)
                  setForm(p => ({ ...p, otp: "" }))
                  setFieldError("")
                }}
                className="w-fit text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 mb-8"
              >
                <ArrowRight className="h-4 w-4 rotate-180" /> Back
              </button>

              <div className="space-y-2 mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 border border-emerald-200">
                  <Mail className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Check your email</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We sent a 6-digit security code to <span className="font-semibold text-slate-700">{form.email}</span>. 
                  Please enter it below to verify your identity.
                </p>
              </div>

              <form onSubmit={handleLoginStep2} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="otp" className="text-sm font-semibold text-slate-700 sr-only">
                    Security Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="0 0 0 0 0 0"
                    value={form.otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setForm(p => ({ ...p, otp: val }))
                      if (val.length === 6) setFieldError("")
                    }}
                    onFocus={() => setFocusedField("otp")}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                    className={cn(
                      "h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl transition-all duration-300",
                      focusedField === "otp" ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" : "bg-slate-50 hover:bg-slate-100",
                      fieldError ? "border-red-300 bg-red-50/30" : ""
                    )}
                  />
                </div>

                <AnimatePresence>
                  {fieldError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium">{fieldError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={isLoading || form.otp.length !== 6}
                  className={cn(
                    "w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold gap-2 transition-all shadow-sm shadow-[#10B981]/20",
                    isLoading && "opacity-80"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Verify & Sign In
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
