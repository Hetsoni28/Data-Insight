"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/atoms/Logo"

interface AuthLayoutProps {
  children: React.ReactNode
  variant: "login" | "register" | "forgot-password"
}

export function AuthLayout({ children, variant }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between bg-[#064e3b] p-12 relative overflow-hidden">
        {/* Animated Decorative blobs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 h-96 w-96 rounded-full bg-[#10B981]/20 blur-3xl -translate-y-1/2 translate-x-1/2" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#059669]/30 blur-3xl translate-y-1/2 -translate-x-1/2" 
        />

        <div className="relative z-10 w-fit">
          <Logo size={36} whiteMode textClassName="text-lg tracking-tight" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
          }}
          className="relative z-10 space-y-6"
        >
          {variant === "login" ? (
            <>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <Badge className="bg-white/10 text-white border-white/20 text-xs backdrop-blur-sm">Enterprise AI Analytics</Badge>
              </motion.div>
              <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-3xl font-bold text-white leading-tight">
                Your data, your AI,<br />your decisions.
              </motion.h2>
              <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-white/60 text-sm leading-relaxed max-w-sm">
                Join 500+ enterprise teams turning raw data into automated intelligence — without writing a single line of SQL.
              </motion.p>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="grid grid-cols-3 gap-4 pt-4 max-w-md">
                {[{ v: "500+", l: "Companies" }, { v: "0 hrs", l: "Manual work" }, { v: "14 day", l: "Free trial" }].map((s, i) => (
                  <motion.div 
                    key={s.l} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="text-center bg-white/5 border border-white/10 p-3 backdrop-blur-sm"
                  >
                    <div className="text-lg font-bold text-white">{s.v}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{s.l}</div>
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : variant === "register" ? (
            <>
              <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-3xl font-bold text-white leading-tight">
                Start turning data into<br />decisions today.
              </motion.h2>
              <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-white/60 text-sm leading-relaxed max-w-sm">
                Set up your workspace in under 2 minutes and run your first AI report before your next meeting.
              </motion.p>
              <motion.ul variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                {[
                  "14-day free trial, no credit card",
                  "Connect your first data source in minutes",
                  "AI-generated reports from day one",
                  "Cancel or downgrade anytime",
                ].map(b => (
                  <motion.li key={b} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="flex items-center gap-2.5 text-sm text-white/80">
                    <div className="h-5 w-5 bg-[#10B981]/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                    </div>
                    {b}
                  </motion.li>
                ))}
              </motion.ul>
            </>
          ) : (
            <>
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <Badge className="bg-white/10 text-white border-white/20 text-xs backdrop-blur-sm">Secure Recovery</Badge>
              </motion.div>
              <motion.h2 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-3xl font-bold text-white leading-tight">
                Get back to your data,<br />securely and quickly.
              </motion.h2>
              <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-white/60 text-sm leading-relaxed max-w-sm">
                Enter your email to receive a secure reset link. Our enterprise-grade security ensures your data remains protected at all times.
              </motion.p>
            </>
          )}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-white/30 text-xs relative z-10">
          © {new Date().getFullYear()} Data Insight. All rights reserved.
        </motion.p>
      </div>

      {/* ── Right panel ── */}
      <div className="relative flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <Link 
          href="/" 
          className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-sm space-y-7"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-7">
            <Logo size={28} />
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  )
}
