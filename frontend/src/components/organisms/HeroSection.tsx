"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Play, ArrowRight, CheckCircle2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Variants } from "framer-motion"
import { DashboardMockup } from "./DashboardMockup"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } }

const STATS = [
  { value: "500+", label: "Companies" },
  { value: "0 hrs", label: "Reporting" },
  { value: "94%", label: "Confidence" },
]

export function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <section className="pt-20 pb-16 px-4 sm:px-8 bg-white dark:bg-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* ── Top: copy (always full-width on mobile, left col on desktop) ── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* LEFT — copy */}
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="space-y-5 text-center lg:text-left"
          >
            <motion.div variants={fadeUp} className="flex justify-center lg:justify-start">
              <Badge variant="outline" className="text-xs text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5 px-3 py-1 gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] inline-block" />
                Try it free · No credit card required
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight"
            >
              The 24/7 AI Analyst{" "}
              <br className="hidden sm:block" />
              for Your{" "}
              <span className="text-[#10B981]">Enterprise</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
              Replace spreadsheets and manual data entry with a blazing-fast AI intelligence platform.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-[#10B981] hover:bg-[#059669] text-white h-11 px-7 text-sm font-medium shadow-md justify-center w-full sm:w-auto"
                )}
              >
                Sign In <ArrowRight className="h-4 w-4 ml-1" />
              </a>

              <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
                <DialogTrigger asChild>
                  <button
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-11 px-7 text-sm font-medium gap-2 border-slate-200 dark:border-white/10 w-full sm:w-auto justify-center"
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981]/10 shrink-0">
                      <Play className="h-2.5 w-2.5 text-[#10B981] fill-[#10B981]" />
                    </div>
                    Watch Demo
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                  <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Data Insight — Platform Overview</DialogTitle>
                  </DialogHeader>
                  <div className="aspect-video bg-slate-900 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto">
                        <Play className="h-7 w-7 text-[#10B981] fill-[#10B981]" />
                      </div>
                      <p className="text-white/60 text-sm">Product walkthrough — coming soon</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Trust pills */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-x-4 gap-y-2 pt-1 justify-center lg:justify-start">
              {["No credit card required", "14-day free trial", "Cancel anytime"].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />{t}
                </div>
              ))}
            </motion.div>

            {/* Stats — mobile only, shows key numbers compactly */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-3 pt-2 lg:hidden"
            >
              {STATS.map(s => (
                <div key={s.label} className="text-center rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 py-3 px-2">
                  <div className="text-lg font-black text-[#10B981]">{s.value}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — dashboard mockup (desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.25 }}
            className="relative hidden lg:block"
          >
            <DashboardMockup />

          </motion.div>
        </div>

        {/* ── Mobile mockup — full width below copy on small screens ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 lg:hidden"
        >
          <DashboardMockup />
        </motion.div>

        {/* ── Trust bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-14 sm:mt-20 space-y-3"
        >
          <p className="text-center text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase">
            Trusted by enterprise teams and fast-moving startups
          </p>
          <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-8">
            {["NEXUS CO", "AXON DATA", "HI-GROWTH", "MERIDIAN", "PARTNER"].map((t, i) => (
              <div key={i} className="text-slate-300 font-bold text-xs sm:text-sm tracking-widest select-none">{t}</div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
