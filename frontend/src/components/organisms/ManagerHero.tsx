import { motion } from "framer-motion"
import { ShieldAlert, Zap, Server, Activity } from "lucide-react"

export function ManagerHero({ overview, user }: { overview: any, user: any }) {
  return (
    <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 md:p-12 text-white shadow-2xl border border-white/10 group">
      {/* Animated Glowing Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 group-hover:bg-white/30 transition-colors duration-1000" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 group-hover:bg-emerald-900/50 transition-colors duration-1000" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3 tracking-tight drop-shadow-sm">
            {overview?.greeting || `Welcome, ${user?.full_name?.split(' ')[0] || 'Manager'}`}
          </h1>
          <p className="text-slate-300 max-w-2xl text-base md:text-lg opacity-90 leading-relaxed font-medium">
            Oversee operations and access deep insights across {overview?.organization_name || 'your organization'}.
          </p>
        </div>

      </div>
    </div>
  )
}
