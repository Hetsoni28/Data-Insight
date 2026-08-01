import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface OnboardingSuccessStepProps {
  router: any
}

export function OnboardingSuccessStep({ router }: OnboardingSuccessStepProps) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-white/5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 dark:border-white/5 p-8 sm:p-12 text-center relative overflow-hidden"
    >
      {/* Fake Confetti using framer motion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {useMemo(() => [...Array(20)].map((_, i) => ({
          id: i,
          xStart: `${Math.random() * 100}%`,
          xEnd: `${Math.random() * 100}%`,
          scale: Math.random() * 0.5 + 0.5,
          duration: Math.random() * 2 + 1.5,
          delay: Math.random() * 0.2
        })), []).map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              y: "120%", 
              x: particle.xStart,
              rotate: 0,
              scale: particle.scale
            }}
            animate={{ 
              y: "-20%", 
              x: particle.xEnd,
              rotate: 360 
            }}
            transition={{ 
              duration: particle.duration, 
              ease: "easeOut",
              delay: particle.delay
            }}
            className={cn(
              "absolute w-3 h-3 rounded-sm",
              ["bg-blue-500", "bg-emerald-500", "bg-yellow-400", "bg-pink-500", "bg-purple-500"][particle.id % 5]
            )}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-200 relative z-10"
      >
        <CheckCircle2 className="h-10 w-10 text-[#10B981]" />
      </motion.div>

      <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 relative z-10">You&apos;re all set!</h1>
      <p className="text-base text-slate-500 dark:text-slate-400 mb-10 max-w-[280px] mx-auto relative z-10">
        Your organization and workspace are ready. It&apos;s time to put your data to work.
      </p>

      <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-white/5 text-left relative z-10">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Your Next Steps</p>
        <ul className="space-y-4">
          {[
            "Upload a dataset (CSV, XLSX, JSON)",
            "Let our AI profile and cleanse the data",
            "Generate a board-ready Excel report",
          ].map((task, i) => (
            <motion.li 
              key={task} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5 text-[#10B981]" />
              </div>
              {task}
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative z-10">
        <Button
          onClick={() => router.push("/dashboard")}
          className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold gap-2 rounded-xl shadow-lg transition-all"
        >
          Enter Dashboard <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
