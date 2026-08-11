import { motion } from "framer-motion"
import { ShieldAlert, Zap, Server } from "lucide-react"

export function ManagerHero({ overview, user }: { overview: any, user: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 p-8 md:p-10 text-white shadow-lg"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-900 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md uppercase tracking-wider">
              Manager Dashboard
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-black/20 rounded-full text-xs font-medium backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              {overview?.platform_status || "Operational"}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">
            {overview?.greeting || `Good day, ${user?.full_name?.split(' ')[0] || 'Manager'}`}
          </h1>
          <p className="text-emerald-50 max-w-xl text-sm md:text-base opacity-90 leading-relaxed">
            Here's what's happening across your authorized business data at {overview?.organization_name || 'your organization'}.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 min-w-[140px]">
            <span className="text-emerald-100 text-xs font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Plan
            </span>
            <span className="font-semibold capitalize text-lg tracking-tight">{overview?.subscription_plan || "Unknown"}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 min-w-[140px]">
            <span className="text-emerald-100 text-xs font-medium flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> AI Engine
            </span>
            <span className="font-semibold text-lg tracking-tight truncate max-w-[120px]">{overview?.current_ai_provider || "Standard"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
