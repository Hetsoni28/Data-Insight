"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react"

export function ExecutiveSummaryCard() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['owner-revenue-health'],
    queryFn: async () => {
      const res = await api.get('/owner/subscriptions/analytics/health')
      return res.data
    }
  })

  if (healthLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0A3A2A] border border-emerald-500/30 p-6 shadow-2xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
        <Sparkles className="w-48 h-48 text-white" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-md border border-emerald-500/30 text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-widest">AI Executive Briefing</h2>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Platform financial health is <span className="text-emerald-400">{health?.status}</span>.
          </h3>
          <p className="text-emerald-100/80 leading-relaxed max-w-3xl">
            Revenue growth remains highly positive, driven by strong enterprise conversions. 
            AI consumption costs are well within the 20% margin threshold. However, we recommend 
            monitoring active subscriptions as recent trial conversions have slowed slightly. 
            Overall profitability score sits at a healthy {health?.metrics?.profitability}/100.
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px] shrink-0 w-full md:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-100/80">Revenue Score</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              {health?.metrics?.revenue_score} <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-100/80">Growth Score</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              {health?.metrics?.growth_score} <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-100/80">Risk Factor</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              Low <AlertTriangle className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
