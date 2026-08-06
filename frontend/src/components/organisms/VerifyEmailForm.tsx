"use client"

import Link from "next/link"
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function VerifyEmailForm() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [timer, setTimer] = useState(60)

  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "")
    if (!sanitized && value !== "") return

    const newDigits = [...digits]
    newDigits[index] = sanitized.slice(-1)
    setDigits(newDigits)
    setError("")

    // Auto-advance focus
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pastedData.length === 6) {
      setDigits(pastedData.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  const fullCode = digits.join("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits of your security code.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setIsSuccess(true)
      toast.success("Identity verified successfully!")
    } catch (err) {
      setError("Invalid security code. Please check your email.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    setDigits(["", "", "", "", "", ""])
    setTimer(60)
    inputRefs.current[0]?.focus()
    toast.success("A new 6-digit security code has been sent to your email.")
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 text-center"
        >
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-950">Verification Complete</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
            Your identity has been verified. You can now access your organization workspace.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            Go to Executive Dashboard
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 bg-white p-7 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
              2FA Security Code Verification
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter the 6-digit security code sent to your registered work email.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 block text-center">
                6-Digit Verification Code
              </Label>
              
              {/* ── 6 INDIVIDUAL OTP DIGIT BOXES ── */}
              <div className="flex items-center justify-between gap-2">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
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
              disabled={isLoading || fullCode.length !== 6}
              className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity & Access"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Didn&apos;t receive code?</span>
            {timer > 0 ? (
              <span className="font-mono text-slate-400">Resend in {timer}s</span>
            ) : (
              <button
                onClick={handleResend}
                className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Tenant Sign In</span>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
