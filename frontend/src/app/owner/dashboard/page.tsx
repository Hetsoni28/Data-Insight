"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Database, FileSpreadsheet, TrendingUp, Users, Building2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"

import { DashboardUsageChart } from "@/components/organisms/DashboardUsageChart"
import { DashboardActivityFeed } from "@/components/organisms/DashboardActivityFeed"
import { DashboardHero } from "@/components/organisms/DashboardHero"
import { LiveKpiGrid } from "@/components/organisms/LiveKpiGrid"

export default function DashboardPage() {
  const router = useRouter()
  const { data: user } = useAuth()
  const { activeWs, setIsUploadOpen } = useWorkspaceStore()
  
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchKpis = async () => {
    try {
      const { data } = await api.get(`/admin/kpis`)
      setKpis(data)
    } catch (error) {
      console.error("Failed to fetch global KPIs", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKpis()
    
    // Listen for upload success to refresh stats
    const handleRefresh = () => fetchKpis()
    window.addEventListener("dataset-uploaded", handleRefresh)
    return () => window.removeEventListener("dataset-uploaded", handleRefresh)
  }, [])

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-20">
        {/* Hero skeleton */}
        <div className="h-40 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        {/* KPI grid skeleton — 12 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
          <div className="lg:col-span-2 h-72 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-72 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-20">
      
      {/* V2 Hero Section */}
      <DashboardHero user={user} kpis={kpis} />

      {/* Header */}
      <div className="flex items-end justify-between mt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Health & KPIs</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time metrics across all organizations.</p>
        </div>
      </div>

      {/* V2 KPI Grid (12 Cards) */}
      <LiveKpiGrid kpis={kpis} />
      
      {/* 2. Main Grid Layout for Charts & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-12">
        
        {/* Left Column (Chart) */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4">Platform Usage Trends</h3>
          <DashboardUsageChart />
        </div>

        {/* Right Column (Quick Actions & Activity) */}
        <div className="space-y-6 lg:space-y-8 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4">Recent Activity</h3>
          <div className="flex-1 min-h-[400px]">
            <DashboardActivityFeed />
          </div>
        </div>
        
      </div>
    </div>
  )
}
