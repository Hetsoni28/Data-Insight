"use client"
import Link from "next/link"
import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2, Mail, ArrowRight, Check, X, Building2, AlertCircle } from "lucide-react"
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

export function RegisterForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [step, setStep] = useState<"register" | "verify">("register")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [fieldError, setFieldError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" })
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Password Strength Rules ───────────────────────────────────────────────
  const rules = useMemo(() => [
    { id: "length", text: "At least 8 characters", test: (v: string) => v.length >= 8 },
    { id: "upper", text: "1 uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { id: "number", text: "1 number", test: (v: string) => /[0-9]/.test(v) },
    { id: "special", text: "1 special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  ], [])

  const passwordMeetsAllRules = rules.every(r => r.test(form.password))

  // ── Handlers ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCountdown])

  const setFormValue = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError("")
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError("")

    if (!passwordMeetsAllRules) {
      setFieldError("Please meet all password requirements.")
      return
    }

    setIsLoading(true)
    try {
      await registerUser({
        email: form.email,
        password: form.password,
        full_name: form.name || undefined,
      })
      
      toast.success("Account created! Check your email for the code.")
      setResendCountdown(60) // Start countdown for resend
      setStep("verify")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Registration failed. Please try again."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

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
      const { access_token } = await verifyEmailOTP({
        email: form.email,
        otp,
      })

      await login(access_token)
      toast.success("Email verified! Welcome to Data Insight 🎉")
      router.push("/onboarding")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Invalid or expired code."
      setFieldError(msg)
      // Clear OTP on error
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
      const msg = axiosErr.response?.data?.message ?? "Failed to resend code."
      toast.error(msg)
    } finally {
      setIsResending(false)
    }
  }

  // ── OTP Input Handlers ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    if (!/^[0-9]*$/.test(val)) return
    
    const newOtp = [...otpValues]
    newOtp[index] = val
    setOtpValues(newOtp)

    if (val !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
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
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i]
      }
      setOtpValues(newOtp)
      // Focus the next empty box or the last one
      const nextFocus = Math.min(pasted.length, 5)
      otpRefs.current[nextFocus]?.focus()
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === "register" ? (
          <motion.div
            key="register"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -20 }}
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {/* Header */}
            <motion.div variants={item} className="space-y-1 mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
              <p className="text-sm text-slate-500">Start your 14-day free trial — no card required</p>
            </motion.div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name & Company */}
              <motion.div variants={item} className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={form.name} 
                    onChange={setFormValue("name")} 
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "h-11 bg-white border-slate-200 transition-all duration-300",
                      focusedField === "name" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                    )}
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="company" className="text-sm font-semibold text-slate-700">
                    Company <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="company" 
                      value={form.company} 
                      onChange={setFormValue("company")} 
                      onFocus={() => setFocusedField("company")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "h-11 bg-white border-slate-200 pl-9 transition-all duration-300",
                        focusedField === "company" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                      )}
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={item} className="space-y-2 relative">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Work email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={form.email} 
                  onChange={setFormValue("email")} 
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "h-11 bg-white border-slate-200 transition-all duration-300",
                    focusedField === "email" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                  )}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={item} className="space-y-2 relative">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={form.password} 
                    onChange={setFormValue("password")} 
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "h-11 bg-white border-slate-200 pr-10 transition-all duration-300",
                      focusedField === "password" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                    )}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Checklist */}
                <AnimatePresence>
                  {form.password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-2 grid grid-cols-2 gap-y-2 gap-x-4"
                    >
                      {rules.map((rule) => {
                        const passed = rule.test(form.password)
                        return (
                          <div key={rule.id} className="flex items-center gap-1.5 text-xs">
                            {passed ? (
                              <Check className="h-3.5 w-3.5 text-[#10B981]" />
                            ) : (
                              <X className="h-3.5 w-3.5 text-slate-300" />
                            )}
                            <span className={cn(passed ? "text-slate-700" : "text-slate-400")}>
                              {rule.text}
                            </span>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {fieldError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
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
              <motion.div variants={item} className="pt-2">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    disabled={isLoading || (form.password.length > 0 && !passwordMeetsAllRules)} 
                    className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold gap-2 shadow-sm shadow-[#10B981]/20 transition-all"
                  >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : "Create free account"}
                  </Button>
                </motion.div>
              </motion.div>
              
              {/* Terms */}
              <motion.p variants={item} className="text-[11px] text-center text-slate-400 mt-4">
                By creating an account you agree to our <a href="/terms" className="text-[#10B981] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[#10B981] hover:underline">Privacy Policy</a>.
              </motion.p>
            </form>
            
            <motion.p variants={item} className="text-center text-sm text-slate-500 mt-8">
              Already have an account? <Link href="/login" className="text-[#10B981] font-semibold hover:text-[#059669] transition-colors">Sign in <span aria-hidden="true">&rarr;</span></Link>
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 py-4"
          >
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                <Mail className="h-7 w-7 text-[#10B981]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Check your email</h1>
              <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                We sent a 6-digit verification code to <br/>
                <span className="font-semibold text-slate-900">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-slate-700 text-center block">Enter verification code</Label>
                
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpValues.map((val, i) => (
                    <Input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onFocus={() => setFocusedField(`otp-${i}`)}
                      onBlur={() => setFocusedField(null)}
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
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
                  type="submit" 
                  disabled={isLoading || otpValues.join("").length !== 6} 
                  className="w-full h-12 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold gap-2 shadow-sm shadow-[#10B981]/20 transition-all text-base"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify Account <ArrowRight className="h-5 w-5" /></>}
                </Button>
              </motion.div>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Didn't receive the code?{" "}
                {resendCountdown > 0 ? (
                  <span className="text-slate-400">Resend in {resendCountdown}s</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResend} 
                    disabled={isResending} 
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
