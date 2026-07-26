"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, ArrowRight, CheckCircle2, Zap, BarChart3, Database, FileSpreadsheet, BrainCircuit, TrendingUp, Download, MessageSquare, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Variants } from "framer-motion"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } }

import { DashboardMockup } from "./DashboardMockup"

export function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <section className="pt-24 pb-16 px-5 sm:px-8 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          <motion.div variants={fadeUp}>
            <Badge variant="outline" className="text-xs text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5 px-3 py-1 gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] inline-block" />
              Try it for free · No credit card required
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            The 24/7 AI Analyst for Your{" "}
            <span className="text-[#10B981]">Enterprise</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-lg">
            Replace spreadsheets, fragmented CSV files, and manual data entry with a blazing-fast automated intelligence platform.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <a href="/register" className={cn(buttonVariants({ size: "lg" }), "bg-[#10B981] hover:bg-[#059669] text-white h-11 px-7 text-sm font-medium shadow-md justify-center")}>
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </a>
            {/* Watch Video — opens Dialog */}
            <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
              <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-7 text-sm font-medium gap-2 border-slate-200")}>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981]/10">
                  <Play className="h-2.5 w-2.5 text-[#10B981] fill-[#10B981]" />
                </div>
                Watch Video
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
                    <p className="text-white/60 text-sm">Product walkthrough video — coming soon</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {["No credit card required", "14-day free trial", "Cancel anytime"].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />{t}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.25 }} className="relative"
        >
          <DashboardMockup />
          <motion.div
            animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-4 right-6 bg-white rounded-xl shadow-lg border px-4 py-2.5 flex items-center gap-2"
          >
            <div className="h-5 w-5 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <Zap className="h-3 w-3 text-[#10B981]" />
            </div>
            <span className="text-xs font-medium text-slate-700">Reduce Reporting to 0 Hours</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="max-w-7xl mx-auto mt-20 space-y-4">
        <p className="text-center text-xs text-slate-400 tracking-widest uppercase">Trusted by enterprise teams and fast-moving startups</p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {["STARTUP", "STARTUP", "HI-GROWTH", "GROWTH", "PARTNER"].map((t, i) => (
            <div key={i} className="text-slate-300 font-bold text-sm tracking-widest select-none">{t}</div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
