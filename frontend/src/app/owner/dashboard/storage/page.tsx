"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { motion } from "framer-motion"

import { storageService } from "@/lib/storageService"
import { StorageHeroBanner } from "@/components/organisms/StorageHeroBanner"
import { StorageLiveKpis } from "@/components/organisms/StorageLiveKpis"
import { StorageExecutiveSummary } from "@/components/organisms/StorageExecutiveSummary"
import { StorageAnalyticsCharts } from "@/components/organisms/StorageAnalyticsCharts"
import { StorageOrganizationUsage } from "@/components/organisms/StorageOrganizationUsage"
import { StorageBucketManagement } from "@/components/organisms/StorageBucketManagement"
import { StorageFileExplorer } from "@/components/organisms/StorageFileExplorer"
import { StorageBackupCenter } from "@/components/organisms/StorageBackupCenter"
import { StorageSecurityCenter } from "@/components/organisms/StorageSecurityCenter"
import { StorageActivityTimeline } from "@/components/organisms/StorageActivityTimeline"

export default function StorageCommandCenterPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All Files")

  // Fetch Overview (KPIs)
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['owner-storage', 'overview'],
    queryFn: storageService.getOverview,
    refetchInterval: 30000
  })

  // Fetch Analytics
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['owner-storage', 'analytics'],
    queryFn: storageService.getAnalytics
  })

  // Fetch Organizations
  const { data: organizations } = useQuery({
    queryKey: ['owner-storage', 'organizations'],
    queryFn: storageService.getOrganizations
  })

  // Fetch Buckets
  const { data: buckets } = useQuery({
    queryKey: ['owner-storage', 'buckets'],
    queryFn: storageService.getBuckets
  })

  // Fetch Files
  const { data: filesData } = useQuery({
    queryKey: ['owner-storage', 'files', searchQuery],
    queryFn: () => storageService.getFiles({ q: searchQuery, limit: 100 })
  })

  // Fetch Backups
  const { data: backups } = useQuery({
    queryKey: ['owner-storage', 'backups'],
    queryFn: storageService.getBackups
  })

  // Fetch Security
  const { data: security } = useQuery({
    queryKey: ['owner-storage', 'security'],
    queryFn: storageService.getSecurity
  })

  // Fetch Activity
  const { data: activity } = useQuery({
    queryKey: ['owner-storage', 'activity'],
    queryFn: storageService.getActivity
  })

  // Global refresh
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['owner-storage'] })
  }, [queryClient])


  // Loading State
  if (loadingOverview || loadingAnalytics) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-[280px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-[200px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
        <div className="h-[400px] w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 min-h-screen pb-24 bg-slate-50 dark:bg-transparent"
    >
      {/* 1. Hero Banner */}
      <StorageHeroBanner onSearch={setSearchQuery} onRefresh={handleRefresh} onFilterChange={setActiveFilter} />

      {/* 2. KPI Dashboard */}
      <StorageLiveKpis overview={overview} />

      {/* 3. Executive AI Summary */}
      <StorageExecutiveSummary overview={overview} />

      {/* 4. Analytics */}
      <StorageAnalyticsCharts trends={analytics?.trends} overview={overview} />

      {/* 5. Main Content Grids */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <StorageFileExplorer files={filesData?.files} activeFilter={activeFilter} />
        </div>
        <div className="space-y-6">
          <StorageOrganizationUsage organizations={organizations?.organizations} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <StorageBucketManagement buckets={buckets?.buckets} />
        </div>
        <div className="xl:col-span-1">
          <StorageBackupCenter backups={backups?.backups} />
        </div>
        <div className="xl:col-span-1">
          <StorageSecurityCenter security={security?.security} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-2">
          <StorageActivityTimeline activities={activity?.activities} />
        </div>
      </div>

    </motion.div>
  )
}
