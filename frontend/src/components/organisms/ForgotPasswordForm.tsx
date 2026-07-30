"use client"
import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/atoms/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.detail ?? "Something went wrong. Please try again.")
        return
      }
      setStep("sent")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={{
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    }} className="w-full max-w-sm space-y-8">
      {/* Logo */}
      <motion.div variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }}>
        <Logo size={28} />
      </motion.div>

      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.div key="email-step"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot your password?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No worries — enter your email and we&apos;ll send a reset link right away.
              </p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-[#10B981]" />
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</Label>
                <Input id="email" type="email" placeholder="you@company.com" required autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="h-10 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-[#10B981]" />
              </motion.div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </motion.p>
              )}

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" disabled={isLoading}
                      className="w-full h-10 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-medium gap-2 shadow-sm shadow-[#10B981]/20">
                      {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : "Send reset link"}
                    </Button>
                  </motion.div>
                </motion.div>
            </form>

            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="sent-step"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-[#10B981]" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your inbox</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>.
                The link expires in 30 minutes.
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed">
              Didn&apos;t receive the email? Check your spam folder, or{" "}
              <button onClick={() => setStep("email")} className="font-medium underline hover:no-underline">
                try a different address
              </button>.
            </div>

            <Button variant="outline" className="w-full h-10 border-slate-200 dark:border-white/10" onClick={() => setStep("email")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to reset
            </Button>

            <Link href="/login" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-fit mx-auto">
              Return to sign in →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
