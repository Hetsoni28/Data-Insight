"use client";

import { motion } from "framer-motion"
import { Building2, ShieldCheck, Activity, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface DashboardHeroProps {
  user: any;
  kpis: any;
}

export function DashboardHero({ user, kpis }: DashboardHeroProps) {
  const router = useRouter()
  const firstName = user?.full_name?.split(" ")[0] || "there"
  const [greeting, setGreeting] = useState("Welcome")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  return (
    <div className="relative overflow-hidden bg-[#0c402d] rounded-lg p-8 md:p-10 shadow-xl mb-8 border border-[#082f22]">
      {/* Animated Particles / Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        
        {/* Welcome Text */}
        <div className="space-y-4 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            {greeting}, {firstName} <span className="inline-block origin-[70%_70%] hover:animate-wave">👋</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-emerald-100/80 text-lg max-w-xl leading-relaxed"
          >
            Your platform is operating normally. You have <span className="text-white font-semibold">{kpis?.organizations?.active || 0} active organizations</span> and generated <span className="text-white font-semibold">${(kpis?.billing?.mrr || 0).toLocaleString()} MRR</span> this month.
          </motion.p>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <Button 
            onClick={() => router.push("/owner/dashboard/organizations")}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-11 px-5 rounded-md transition-all shadow-lg backdrop-blur-md"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Manage Orgs
          </Button>
          <Button 
            onClick={() => router.push("/owner/dashboard/users")}
            className="bg-emerald-500 hover:bg-emerald-400 text-white h-11 px-5 rounded-md border-t border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
