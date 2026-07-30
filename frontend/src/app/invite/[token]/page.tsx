"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Loader2, ArrowRight, Check, X, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { acceptInvite } from "@/lib/auth.service"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

const PASSWORD_RULES = [
  { id: "length",  text: "At least 8 characters",   test: (v: string) => v.length >= 8 },
  { id: "upper",   text: "1 uppercase letter",        test: (v: string) => /[A-Z]/.test(v) },
  { id: "number",  text: "1 number",                  test: (v: string) => /[0-9]/.test(v) },
  { id: "special", text: "1 special character",       test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const { login } = useAuthStore()

  const [form, setForm] = useState({ fullName: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldError, setFieldError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const passwordMeetsAllRules = PASSWORD_RULES.every(r => r.test(form.password))

  const setFormValue = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldError("")
    setForm(p => ({ ...p, [key]: e.target.value }))
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

    setIsLoading(true)
    try {
      const { access_token } = await acceptInvite({
        token: params.token,
        full_name: form.fullName.trim(),
        password: form.password,
      })
      await login(access_token)
      toast.success("Account activated successfully!")
      router.push("/dashboard")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      const msg = axiosErr.response?.data?.message ?? "Invalid or expired invitation link."
      setFieldError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-white/5 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white dark:bg-white/5 rounded-3xl p-8 sm:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-200/60 dark:border-white/10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 mb-5 border border-emerald-100 shadow-sm">
            <svg className="h-6 w-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Accept Invitation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            You&apos;ve been invited to join Data Insight. Set up your profile to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Full name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName" required
              value={form.fullName} onChange={setFormValue("fullName")}
              onFocus={() => setFocusedField("fullName")} onBlur={() => setFocusedField(null)}
              placeholder="Your full name"
              className={cn(
                "h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 transition-all duration-300",
                focusedField === "fullName" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Set a password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password" type={showPassword ? "text" : "password"} required
                value={form.password} onChange={setFormValue("password")}
                onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                className={cn(
                  "h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 pr-10 transition-all duration-300",
                  focusedField === "password" && "border-[#10B981] ring-4 ring-[#10B981]/10 shadow-sm"
                )}
              />
              <button
                type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

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
                        <span className={cn(passed ? "text-slate-700 dark:text-slate-300" : "text-slate-400")}>{rule.text}</span>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || (form.password.length > 0 && !passwordMeetsAllRules)}
              className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold gap-2 shadow-sm shadow-[#10B981]/20 transition-all"
            >
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Activating...</> : <>Activate Account <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
