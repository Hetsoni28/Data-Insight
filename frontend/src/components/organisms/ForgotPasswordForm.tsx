"use client"

import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordReset } from "@/lib/auth.service"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types"

type Step = "email" | "sent"

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await requestPasswordReset({ email })
      setStep("sent")
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>
      setError(axiosErr.response?.data?.message ?? "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
                Reset Password
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your organization work email to receive a password reset link.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Organization Work Email</Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    type="email"
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-10 text-xs border-slate-200 bg-slate-50 text-slate-900 focus:ring-emerald-500"
                    required
                  />
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
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Tenant Sign In</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sent-step"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 text-center"
          >
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-950">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. The link expires in 30 minutes.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button onClick={() => setStep("email")} className="font-semibold underline hover:no-underline">
                try again
              </button>.
            </div>

            <Link
              href="/login"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Sign In</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
