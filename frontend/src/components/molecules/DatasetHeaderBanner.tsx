"use client"

import { motion } from "framer-motion"
import { ArrowLeft, BrainCircuit, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DatasetHeaderBannerProps {
  title: string | React.ReactNode
  description: string | React.ReactNode
  icon?: React.ReactNode
  badges?: React.ReactNode
  showBack?: boolean
  backLink?: string
  actions?: React.ReactNode
}

export function DatasetHeaderBanner({
  title,
  description,
  icon,
  badges,
  showBack,
  backLink,
  actions
}: DatasetHeaderBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-br from-[#083324] via-[#0c402d] to-[#041a12] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20 border border-emerald-500/30"
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/25 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-5 max-w-3xl">
          {showBack && backLink && (
            <Link href={backLink}>
              <Button variant="ghost" size="sm" className="pl-0 text-emerald-200/60 hover:text-white hover:bg-transparent -ml-2 mb-2 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explorer
              </Button>
            </Link>
          )}

          <div className="flex flex-col md:flex-row md:items-center gap-5">
            {icon && (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md shadow-inner">
                {icon}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {!icon && badges}
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {title}
                </h1>
                {icon && badges}
              </div>
              <p className="text-emerald-100/90 text-lg md:text-xl leading-relaxed font-medium">
                {description}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto mt-4 md:mt-0 shrink-0">
          {actions || (
            <>
              <Button className="bg-emerald-500 hover:bg-emerald-400 border-none text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] h-12 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                <BrainCircuit className="w-5 h-5 mr-2.5" />
                Ask AI Copilot
              </Button>
              <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-md h-12 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                <LineChart className="w-5 h-5 mr-2.5 text-emerald-400" />
                Dashboards
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
