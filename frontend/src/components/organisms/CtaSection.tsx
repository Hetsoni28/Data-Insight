"use client"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CtaSection() {
  return (
    <section className="bg-[#064e3b] py-14 sm:py-20 px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55 }}
        className="max-w-3xl mx-auto text-center space-y-6"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Ready to automate your intelligence?
        </h2>
        <p className="text-white/70 text-base leading-relaxed">
          Join 500+ forward-thinking organizations using Data Insight to eliminate manual reporting every week.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <a href="/login" className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 px-8 text-sm border-white/30 text-white hover:bg-white/10 bg-transparent justify-center"
          )}>
            Sign In
          </a>
          <a href="mailto:sales@datainsight.ai" className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 px-8 text-sm bg-white dark:bg-white/5 text-[#10B981] hover:bg-slate-50 dark:hover:bg-white/5 font-semibold shadow-lg gap-1.5 justify-center"
          )}>
            Talk to Sales <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </section>
  )
}
