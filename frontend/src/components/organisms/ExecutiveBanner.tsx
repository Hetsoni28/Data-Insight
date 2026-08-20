"use client";

import { motion } from "framer-motion"
import { Building2, Plus, Server, Activity, ShieldCheck, Sun, FileSpreadsheet, CloudLightning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"

interface ExecutiveBannerProps {
  user: any;
  kpis: any;
  onOpenAiAssistant?: () => void;
}

export function ExecutiveBanner({ user, kpis, onOpenAiAssistant }: ExecutiveBannerProps) {
  const router = useRouter()
  const firstName = user?.full_name?.split(" ")[0] || "Executive"
  const [greeting, setGreeting] = useState("Welcome")
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const hour = time.getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [time])

  return (
    <div className="relative overflow-hidden bg-[#0c402d] rounded-2xl p-8 md:p-10 shadow-xl mb-8 border border-[#082f22]">
      {/* Animated Particles / Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05] pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        
        {/* Welcome Text & Meta */}
        <div className="space-y-6 max-w-3xl">
          {/* Removed Top Meta row as requested */}


          {/* Main Greeting */}
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight"
            >
              {greeting}, {firstName} <span className="inline-block origin-[70%_70%] hover:animate-wave">👋</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-emerald-100/80 text-lg md:text-xl max-w-2xl mt-4 leading-relaxed"
            >
              Executive Command Center. Monitoring <span className="text-white font-semibold">{kpis?.organizations?.active || 0} active organizations</span> and <span className="text-white font-semibold">${(kpis?.billing?.mrr || 0).toLocaleString()} MRR</span> across the platform.
            </motion.p>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:flex-wrap gap-3 xl:w-auto w-full"
        >
          <Button 
            onClick={() => router.push("/owner/dashboard/organizations?action=new")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 h-12 px-5 rounded-xl transition-all shadow-sm backdrop-blur-sm col-span-2 sm:col-span-1"
          >
            <Building2 className="w-4 h-4 mr-2 text-emerald-300" />
            New Org
          </Button>
          <Button 
            onClick={() => router.push("/owner/dashboard/users")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 h-12 px-5 rounded-xl transition-all shadow-sm backdrop-blur-sm"
          >
            <Plus className="w-4 h-4 mr-2 text-emerald-300" />
            Invite
          </Button>
          <Button 
            onClick={() => router.push("/owner/dashboard/reports")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 h-12 px-5 rounded-xl transition-all shadow-sm backdrop-blur-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-300" />
            Report
          </Button>
          <Button 
            onClick={onOpenAiAssistant}
            className="bg-emerald-500 hover:bg-emerald-400 text-white h-12 px-6 rounded-xl border-t border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all col-span-2 sm:col-span-3 xl:col-span-1"
          >
            {/* Data Insight logo mark — D+I + chart sparkline */}
            <svg
              viewBox="0 0 170 130"
              className="w-5 h-5 mr-2 flex-shrink-0"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="btn-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#d1fae5" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="btn-grad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a7f3d0" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              {/* D stroke */}
              <path
                d="M 20 100 V 0 H 50 C 83 0 110 22 110 50 C 110 78 83 100 50 100 H 20 Z"
                stroke="url(#btn-grad1)"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* I stroke */}
              <line
                x1="140" y1="0" x2="140" y2="100"
                stroke="url(#btn-grad2)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Chart sparkline */}
              <path
                d="M 45 65 L 70 40 L 90 55 L 140 10"
                stroke="#ffffff"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.9"
              />
              {/* Dot at top of sparkline */}
              <circle cx="140" cy="10" r="6" fill="#ffffff" />
            </svg>
            Ask AI Assistant
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
