"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-8 lg:px-16 bg-[#047857] text-white overflow-hidden border-t border-[#065F46]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto text-center space-y-6"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Deploy a Dedicated Enterprise AI Platform{" "}
          <span className="text-emerald-200">For Your Organization.</span>
        </h2>

        <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
          Provision your private single-tenant instance with custom domain white-labeling,
          living Excel formula compilation, autonomous executive briefings, and 24/7 dedicated engineering support.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-white hover:bg-emerald-50 text-[#047857] font-extrabold h-12 px-8 text-sm rounded-xl shadow-md w-full sm:w-auto transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Link href="/login" className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <span>Request System Access</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 text-sm font-bold h-12 px-7 rounded-xl w-full sm:w-auto whitespace-nowrap cursor-pointer"
          >
            <a href="mailto:licensing@datainsight.com" className="inline-flex items-center gap-2 text-white">
              <Mail className="h-4 w-4 text-white shrink-0" />
              <span className="text-white font-bold">Contact Licensing Team</span>
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
