"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { HardDrive, Star, Target, ArrowRight, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScoreRing } from "@/components/molecules/ScoreRing"
import { StatusBadge } from "@/components/molecules/StatusBadge"
import { TrendBadge } from "@/components/molecules/TrendBadge"

interface KPIs {
  datasets: { total: number }
  reports: { total: number }
  storage_mb: number
  ai_requests: { total: number; growth: number }
  productivity_score: number
  data_quality_score: number
}

interface Overview {
  subscription_plan: string
  subscription_status: string
  current_ai_provider: string
}

export function OrganizationScoreCards({ kpis, overview }: { kpis: KPIs | null; overview: Overview | null }) {
  if (!kpis) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Performance Scores */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Performance Scores</h3>
        </div>
        <div className="flex justify-around items-center py-2">
          <ScoreRing score={kpis.productivity_score ?? 0} label="Productivity" color="#10B981" />
          <ScoreRing score={kpis.data_quality_score ?? 0} label="Data Quality" color="#3B82F6" />
        </div>
      </motion.div>

      {/* Storage */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
            <HardDrive className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Storage Overview</h3>
        </div>
        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Used</span>
              <span className="text-slate-900 dark:text-white font-extrabold">{(kpis.storage_mb || 0).toFixed(1)} MB</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min((kpis.storage_mb || 0) / 1024 * 100, 100)}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span>0 MB</span><span>1 GB limit</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-base font-extrabold text-slate-900 dark:text-white">{kpis.datasets?.total ?? 0}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Datasets</div>
            </div>
            <div className="bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl p-3 text-center shadow-2xs">
              <div className="text-base font-extrabold text-slate-900 dark:text-white">{kpis.reports?.total ?? 0}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Reports</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div 
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
            <Star className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Subscription</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Plan</span>
            <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30 capitalize text-xs font-bold px-2.5 py-0.5">
              {overview?.subscription_plan ?? "Enterprise"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
            <StatusBadge status={overview?.subscription_status ?? "active"} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">AI Provider</span>
            <span className="text-xs text-slate-900 dark:text-white font-bold truncate max-w-[160px]">
              {overview?.current_ai_provider ?? "GPT-4o"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">AI Requests</span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-extrabold flex items-center gap-1">
              {kpis.ai_requests?.total?.toLocaleString() ?? 0}
              <TrendBadge growth={kpis.ai_requests?.growth} />
            </span>
          </div>
          <Link href="/organization-admin/dashboard/billing">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-1 flex items-center justify-center gap-2 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 rounded-xl py-2 text-xs font-bold transition-all shadow-xs"
            >
              Manage Billing <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
