"use client"
import Link from "next/link"
import { HardDrive, Star, Target, ArrowRight } from "lucide-react"
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Performance Scores */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Performance Scores</h3>
        </div>
        <div className="flex justify-around">
          <ScoreRing score={kpis.productivity_score ?? 0} label="Productivity" color="#10B981" />
          <ScoreRing score={kpis.data_quality_score ?? 0} label="Data Quality" color="#3B82F6" />
        </div>
      </div>

      {/* Storage */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Storage Overview</h3>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Used</span>
              <span className="text-slate-900 dark:text-white font-bold">{(kpis.storage_mb || 0).toFixed(1)} MB</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${Math.min((kpis.storage_mb || 0) / 1024 * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-slate-500 dark:text-slate-400">
              <span>0 MB</span><span>1 GB limit</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-transparent rounded-xl p-3 text-center">
              <div className="text-base font-bold text-slate-900 dark:text-white">{kpis.datasets?.total ?? 0}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Datasets</div>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-transparent rounded-xl p-3 text-center">
              <div className="text-base font-bold text-slate-900 dark:text-white">{kpis.reports?.total ?? 0}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Reports</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Subscription</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Plan</span>
            <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30 capitalize text-xs font-semibold">
              {overview?.subscription_plan ?? "\u2014"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
            <StatusBadge status={overview?.subscription_status ?? "\u2014"} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">AI Provider</span>
            <span className="text-xs text-slate-900 dark:text-white font-medium truncate max-w-[160px]">
              {overview?.current_ai_provider ?? "\u2014"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">AI Requests</span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
              {kpis.ai_requests?.total?.toLocaleString() ?? 0}
              <TrendBadge growth={kpis.ai_requests?.growth} />
            </span>
          </div>
          <Link href="/organization-admin/dashboard/billing">
            <button className="w-full mt-1 flex items-center justify-center gap-2 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-300 rounded-xl py-2 text-xs font-semibold transition-all">
              Manage Billing <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
