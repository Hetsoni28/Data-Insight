"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PageLostIllustration } from "@/components/molecules/PageLostIllustration"
import { ArrowLeft, LifeBuoy } from "lucide-react"

export default function NotFound() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Subtle Background Glows using brand colors */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-[100%] blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto"
      >
        
        <div className="mb-6">
          <PageLostIllustration />
        </div>
        
        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-4">
          Page not found
        </h2>
        
        {/* Description */}
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Please check the URL or navigate back to the dashboard.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/owner/dashboard")}
            className="flex items-center gap-2 px-6 py-3 bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/support")}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <LifeBuoy className="w-4 h-4" />
            Contact Support
          </motion.button>
        </div>

      </motion.div>
    </div>
  )
}
