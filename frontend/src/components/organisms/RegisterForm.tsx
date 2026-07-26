"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2, Mail, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { registerUser, verifyEmailOTP, resendOTP } from "@/lib/auth.service"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8) score += 25
  if (/[A-Z]/.test(pw)) score += 25
  if (/[0-9]/.test(pw)) score += 25
  if (/[^A-Za-z0-9]/.test(pw)) score += 25
  if (score <= 25) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 50) return { score, label: "Fair", color: "bg-yellow-500" }
  if (score <= 75) return { score, label: "Good", color: "bg-blue-500" }
  return { score, label: "Strong", color: "bg-[#10B981]" }
}

export function RegisterForm() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [step, setStep] = useState<"register" | "verify">("register")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [fieldError, setFieldError] = useState("")
  
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", otp: "" })

  const strength = getPasswordStrength(form.password)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError("")
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError("")

    if (strength.score < 50) {
      setFieldError("Please choose a stronger password (min. 8 chars, uppercase, number).")
      return
    }

    setIsLoading(true)
    try {
      // 1. Register the account
      await registerUser({
        email: form.email,
        password: form.password,
        full_name: form.name || undefined,
      })
      
      toast.success("Account created! Check your email for the code.")
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

    if (form.otp.length !== 6) {
      setFieldError("Please enter the 6-digit code.")
      return
    }

    setIsLoading(true)
    try {
      // 2. Submit OTP
      const { access_token } = await verifyEmailOTP({
        email: form.email,
        otp: form.otp,
      })

      // 3. Store token + fetch /auth/me profile
      await login(access_token)
      toast.success("Email verified! Welcome to Data Insight 🎉")
      router.push("/onboarding")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Invalid or expired code."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      await resendOTP({ email: form.email })
      toast.success("A new verification code has been sent.")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Failed to resend code."
      toast.error(msg)
    } finally {
      setIsResending(false)
    }
  }

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
            <motion.div variants={item} className="space-y-1 mb-7">
              <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
              <p className="text-sm text-slate-500">Start your 14-day free trial — no card required</p>
            </motion.div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name + Company */}
              <motion.div variants={item} className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full name</Label>
                  <Input id="name" required value={form.name} onChange={set("name")} className="h-10 bg-white border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-sm font-medium text-slate-700">Company <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Input id="company" value={form.company} onChange={set("company")} className="h-10 bg-white border-slate-200" />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={item} className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Work email</Label>
                <Input id="email" type="email" required value={form.email} onChange={set("email")} className="h-10 bg-white border-slate-200" />
              </motion.div>

              {/* Password */}
              <motion.div variants={item} className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} required value={form.password} onChange={set("password")} className="h-10 bg-white border-slate-200 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Password strength</span>
                      <span className={cn("font-medium", strength.score >= 75 ? "text-[#10B981]" : strength.score >= 50 ? "text-blue-500" : "text-red-500")}>
                        {strength.label}
                      </span>
                    </div>
                    <Progress value={strength.score} className="h-1" />
                  </div>
                )}
              </motion.div>

              {fieldError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fieldError}</p>}

              {/* Terms */}
              <motion.p variants={item} className="text-[11px] text-slate-400">
                By creating an account you agree to our <a href="/terms" className="text-[#10B981] hover:underline">Terms of Service</a> and <a href="/privacy" className="text-[#10B981] hover:underline">Privacy Policy</a>.
              </motion.p>

              {/* Submit */}
              <motion.div variants={item}>
                <Button type="submit" disabled={isLoading} className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-medium gap-2 shadow-sm">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : "Create free account"}
                </Button>
              </motion.div>
            </form>
            
            <motion.p variants={item} className="text-center text-sm text-slate-500 mt-7">
              Already have an account? <Link href="/login" className="text-[#10B981] font-medium hover:underline">Sign in →</Link>
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
              <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
                We sent a 6-digit verification code to <span className="font-medium text-slate-900">{form.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-sm font-medium text-slate-700 text-center block">Enter verification code</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  required 
                  value={form.otp} 
                  onChange={set("otp")} 
                  className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-white border-slate-200" 
                />
              </div>

              {fieldError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">{fieldError}</p>}

              <Button type="submit" disabled={isLoading || form.otp.length !== 6} className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-medium gap-2 shadow-sm">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                Didn't receive the code?{" "}
                <button type="button" onClick={handleResend} disabled={isResending} className="text-[#10B981] font-medium hover:underline disabled:opacity-50">
                  {isResending ? "Sending..." : "Click to resend"}
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
