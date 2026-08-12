"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

import { ExecutiveBanner } from "@/components/organisms/ExecutiveBanner"
import { LiveKpiGrid } from "@/components/organisms/LiveKpiGrid"
import { PlatformHealthOverview } from "@/components/organisms/PlatformHealthOverview"
import { AnalyticsGrid } from "@/components/organisms/AnalyticsGrid"
import { DashboardActivityFeed } from "@/components/organisms/DashboardActivityFeed"
import { DashboardUsageChart } from "@/components/organisms/DashboardUsageChart"
import { ExecutiveAIPanel } from "@/components/organisms/ExecutiveAIPanel"

export default function DashboardPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  
  const [analytics, setAnalytics] = useState<any>(null)
  const [revenueTrend, setRevenueTrend] = useState<any>(null)
  const [aiOverview, setAiOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [analyticsRes, aiRes, revenueRes] = await Promise.all([
        api.get(`/owner/analytics/overview`),
        api.get(`/owner/ai/overview`),
        api.get(`/owner/analytics/revenue`)
      ])
      setAnalytics(analyticsRes.data)
      setAiOverview(aiRes.data)
      setRevenueTrend(revenueRes.data)
    } catch (error) {
      console.error("Failed to fetch executive data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    const handleRefresh = () => fetchData()
    window.addEventListener("dataset-uploaded", handleRefresh)
    return () => window.removeEventListener("dataset-uploaded", handleRefresh)
  }, [])

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-8 pb-20">
        <div className="h-64 w-full rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="h-40 w-full rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
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
      <PlatformHealthOverview />

      {/* 3. Executive KPI Cards */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Executive Metrics</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Live performance indicators across the SaaS ecosystem.</p>
        </div>
        <LiveKpiGrid analytics={analytics?.data} aiOverview={aiOverview} />
      </div>

      {/* 4. Deep Analytics */}
      <AnalyticsGrid 
        analyticsData={{
          revenue: revenueTrend?.data,
          organizations: revenueTrend?.data
        }} 
      />

      {/* 5. Usage & Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <DashboardUsageChart />
        </div>
        <div className="flex flex-col h-[500px]">
          <DashboardActivityFeed />
        </div>
      </div>

      {/* AI Assistant Floating Widget */}
      <ExecutiveAIPanel />
      
    </div>
  )
}
