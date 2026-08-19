"use client"
import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

import { ExecutiveBanner } from "@/components/organisms/ExecutiveBanner"
import { LiveKpiGrid } from "@/components/organisms/LiveKpiGrid"
import { DashboardActivityFeed } from "@/components/organisms/DashboardActivityFeed"
import { ExecutiveAIPanel } from "@/components/organisms/ExecutiveAIPanel"
import dynamic from "next/dynamic"
import {
  DynamicPlatformHealthOverview,
  DynamicDashboardUsageChart,
} from "@/components/charts/dynamic"

const AnalyticsGrid = dynamic(
  () => import("@/components/organisms/AnalyticsGrid").then((mod) => mod.AnalyticsGrid),
  { ssr: false }
)

export default function DashboardPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  
  const queryClient = useQueryClient();

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['owner-analytics-overview'],
    queryFn: async () => {
      const res = await api.get(`/owner/analytics/overview`);
      return res.data;
    }
  });

  const { data: aiOverview, isLoading: loadingAi } = useQuery({
    queryKey: ['owner-ai-overview'],
    queryFn: async () => {
      const res = await api.get(`/owner/ai/overview`);
      return res.data;
    }
  });

  const { data: revenueTrend, isLoading: loadingRevenue } = useQuery({
    queryKey: ['owner-revenue-overview'],
    queryFn: async () => {
      const res = await api.get(`/owner/analytics/revenue`);
      return res.data;
    }
  });

  if (loadingAnalytics || loadingAi) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-50 dark:bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-slate-500/10 dark:bg-slate-500/20 animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-slate-800 dark:text-slate-200 relative z-10" />
          </div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Executive Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1800px] mx-auto space-y-8 pb-20 bg-slate-50 dark:bg-background min-h-screen">
      <title>Platform Owner Dashboard | Data Insight</title>
      
      {/* 1. Executive Welcome Banner */}
      <ExecutiveBanner user={user} kpis={analytics?.data} onOpenAiAssistant={() => {
        // Dispatch a custom event that ExecutiveAIPanel listens to
        window.dispatchEvent(new CustomEvent('toggle-executive-ai'))
      }} />

      {/* 2. Platform Health Overview */}
      <DynamicPlatformHealthOverview />

      {/* 3. Executive KPI Cards */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Metrics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Live performance indicators across the SaaS ecosystem.</p>
        </div>
        <LiveKpiGrid analytics={analytics?.data} aiOverview={aiOverview} />
      </div>

      {/* 4. Main Analytics Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        <div className="xl:col-span-2 space-y-8">
          <AnalyticsGrid 
            analyticsData={{
              revenue: revenueTrend?.data,
              organizations: revenueTrend?.data
            }} 
          />
          <DynamicDashboardUsageChart />
        </div>
        
        <div className="space-y-8">
          <DashboardActivityFeed />
          <ExecutiveAIPanel />
        </div>
      </div>
    </div>
  )
}
