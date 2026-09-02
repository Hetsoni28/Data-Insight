import dynamic from "next/dynamic"
﻿﻿"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { storageService } from "@/lib/storageService"

const StorageHeroBanner = dynamic(() => import('@/components/organisms/StorageHeroBanner').then(m => m.StorageHeroBanner), { ssr: false })
const StorageLiveKpis = dynamic(() => import('@/components/organisms/StorageLiveKpis').then(m => m.StorageLiveKpis), { ssr: false })
const StorageExecutiveSummary = dynamic(() => import('@/components/organisms/StorageExecutiveSummary').then(m => m.StorageExecutiveSummary), { ssr: false })
const StorageAnalyticsCharts = dynamic(() => import('@/components/organisms/StorageAnalyticsCharts').then(m => m.StorageAnalyticsCharts), { ssr: false })
const StorageOrganizationUsage = dynamic(() => import('@/components/organisms/StorageOrganizationUsage').then(m => m.StorageOrganizationUsage), { ssr: false })
const StorageBucketManagement = dynamic(() => import('@/components/organisms/StorageBucketManagement').then(m => m.StorageBucketManagement), { ssr: false })
const StorageFileExplorer = dynamic(() => import('@/components/organisms/StorageFileExplorer').then(m => m.StorageFileExplorer), { ssr: false })
const StorageBackupCenter = dynamic(() => import('@/components/organisms/StorageBackupCenter').then(m => m.StorageBackupCenter), { ssr: false })
const StorageSecurityCenter = dynamic(() => import('@/components/organisms/StorageSecurityCenter').then(m => m.StorageSecurityCenter), { ssr: false })
const StorageActivityTimeline = dynamic(() => import('@/components/organisms/StorageActivityTimeline').then(m => m.StorageActivityTimeline), { ssr: false })


export default function StorageCommandCenterPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All Files")
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Fetch Files with active search query
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

  // Filter buckets based on search query if applicable
  const filteredBuckets = useMemo(() => {
    if (!buckets?.buckets) return []
    if (!searchQuery.trim()) return buckets.buckets
    const q = searchQuery.toLowerCase()
    return buckets.buckets.filter((b: any) => 
      b.name?.toLowerCase().includes(q) || 
      b.type?.toLowerCase().includes(q) ||
      b.region?.toLowerCase().includes(q)
    )
  }, [buckets, searchQuery])

  // Global refresh with active indicator and feedback toast
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await queryClient.refetchQueries({ queryKey: ['owner-storage'] })
      toast.success("Storage metrics & file lists refreshed")
    } catch {
      toast.error("Failed to refresh storage data")
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 400)
    }
  }, [queryClient])

  // Loading State
  if (loadingOverview || loadingAnalytics) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-[280px] w-full bg-slate-200 dark:bg-white/5 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-[200px] w-full bg-slate-200 dark:bg-white/5 animate-pulse rounded-3xl" />
        <div className="h-[400px] w-full bg-slate-200 dark:bg-white/5 animate-pulse rounded-3xl" />
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
      <StorageHeroBanner 
        onSearch={setSearchQuery} 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing}
        onFilterChange={setActiveFilter} 
      />

      {/* 2. KPI Dashboard */}
      <StorageLiveKpis overview={overview} />

      {/* 3. Executive AI Summary */}
      <StorageExecutiveSummary overview={overview} />

      {/* 4. Analytics */}
      <StorageAnalyticsCharts trends={analytics?.trends} overview={overview} />

      {/* 5. Main Content Grids */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <StorageFileExplorer 
            files={filesData?.files} 
            activeFilter={activeFilter} 
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
          />
        </div>
        <div className="space-y-6">
          <StorageOrganizationUsage organizations={organizations?.organizations} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <StorageBucketManagement buckets={filteredBuckets} />
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
