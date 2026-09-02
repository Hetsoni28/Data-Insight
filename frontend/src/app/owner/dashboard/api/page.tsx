"use client"
import dynamic from "next/dynamic"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"

import { gatewayService } from "@/lib/gatewayService"



const GatewayHeroBanner = dynamic(() => import('@/components/organisms/GatewayHeroBanner').then(m => m.GatewayHeroBanner), { ssr: false })
const GatewayLiveKpis = dynamic(() => import('@/components/organisms/GatewayLiveKpis').then(m => m.GatewayLiveKpis), { ssr: false })
const GatewayUsageCharts = dynamic(() => import('@/components/organisms/GatewayUsageCharts').then(m => m.GatewayUsageCharts), { ssr: false })
const GatewaySecurityCenter = dynamic(() => import('@/components/organisms/GatewaySecurityCenter').then(m => m.GatewaySecurityCenter), { ssr: false })
const GatewayDeveloperApps = dynamic(() => import('@/components/organisms/GatewayDeveloperApps').then(m => m.GatewayDeveloperApps), { ssr: false })
const GatewayLiveStream = dynamic(() => import('@/components/organisms/GatewayLiveStream').then(m => m.GatewayLiveStream), { ssr: false })

export default function ApiGatewayPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch Overview Data (KPIs)
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['api-gateway', 'overview'],
    queryFn: gatewayService.getOverview,
    refetchInterval: 30000
  })

  // Fetch Usage Trends
  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['api-gateway', 'usage'],
    queryFn: gatewayService.getUsageTrends
  })

  // Fetch Error Analytics
  const { data: errors } = useQuery({
    queryKey: ['api-gateway', 'errors'],
    queryFn: gatewayService.getErrors
  })

  // Fetch Live Stream
  const { data: liveStream, refetch: refetchLive, isRefetching: isRefetchingLive } = useQuery({
    queryKey: ['api-gateway', 'live-requests'],
    queryFn: () => gatewayService.getLiveRequests(50),
    refetchInterval: 10000
  })

  // Fetch Security Overview
  const { data: security } = useQuery({
    queryKey: ['api-gateway', 'security'],
    queryFn: gatewayService.getSecurityOverview
  })

  // Fetch Developer Apps
  const { data: apps } = useQuery({
    queryKey: ['api-gateway', 'oauth-clients'],
    queryFn: gatewayService.getOAuthClients
  })

  // Global refresh — invalidates all queries
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['api-gateway'] })
  }, [queryClient])

  // Filter live requests by search query
  const allRequests = liveStream?.requests || []
  const filteredRequests = searchQuery
    ? allRequests.filter((r: any) =>
        r.endpoint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ip_address?.includes(searchQuery) ||
        r.method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.status_code).includes(searchQuery)
      )
    : allRequests

  // Loading State (Skeletons)
  if (loadingOverview || loadingUsage) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-[280px] w-full bg-slate-200 dark:bg-white/5 animate-pulse rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="h-[400px] bg-slate-200 dark:bg-white/5 animate-pulse rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6 min-h-screen pb-24 bg-slate-50 dark:bg-transparent">
      {/* Hero Banner — all 3 action buttons + search/filter wired */}
      <GatewayHeroBanner
        onSearch={setSearchQuery}
        onRefresh={handleRefresh}
        liveRequests={allRequests}
      />

      {/* KPI Cards */}
      <div className="mt-8">
        <GatewayLiveKpis overview={overview} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <GatewayUsageCharts trends={usage?.trends} errors={errors?.errors} />

          {/* Live Stream — passes filtered results & refetch */}
          <GatewayLiveStream
            requests={filteredRequests}
            refetch={refetchLive}
            isRefetching={isRefetchingLive}
          />

          {/* Developer Apps — all row actions working */}
          <GatewayDeveloperApps apps={apps?.clients} />
        </div>

        <div className="xl:col-span-1 space-y-6 mt-6">
          <GatewaySecurityCenter security={security} />

          {/* Platform Health Widget */}
          <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Platform Health</h3>
            <div className="space-y-3">
              {[
                { label: "Auth Gateway", status: "healthy" },
                { label: "Analytics Engine", status: "healthy" },
                { label: "ML Prediction API", status: "healthy" },
                { label: "Webhook Dispatcher", status: "healthy" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-500 font-medium">Healthy</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
