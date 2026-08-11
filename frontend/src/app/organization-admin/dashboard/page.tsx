"use client"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { OrganizationHero } from "@/components/organisms/OrganizationHero"
import { OrganizationKpiGrid } from "@/components/organisms/OrganizationKpiGrid"
import { OrganizationScoreCards } from "@/components/organisms/OrganizationScoreCards"
import { OrganizationAnalytics } from "@/components/organisms/OrganizationAnalytics"
import { OrganizationActivityFeed } from "@/components/organisms/OrganizationActivityFeed"
import { OrganizationDatasets } from "@/components/organisms/OrganizationDatasets"
import { OrganizationReports } from "@/components/organisms/OrganizationReports"
import { OrganizationSecurity } from "@/components/organisms/OrganizationSecurity"
import { OrganizationNavStrip } from "@/components/organisms/OrganizationNavStrip"

export default function OrganizationAdminDashboard() {
  const { data: user } = useAuth()
  const [overview, setOverview] = useState<any>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any[]>([])
  const [datasets, setDatasets] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])
  const [security, setSecurity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [oR, kR, cR, dR, rR, aR, sR] = await Promise.all([
        api.get("/tenant-dashboard/overview"), api.get("/tenant-dashboard/kpis"),
        api.get("/tenant-dashboard/charts"), api.get("/tenant-dashboard/datasets"),
        api.get("/tenant-dashboard/reports"), api.get("/tenant-dashboard/activity"),
        api.get("/tenant-dashboard/security"),
      ])
      setOverview(oR.data?.data); setKpis(kR.data?.data)
      setCharts(cR.data?.data || []); setDatasets(dR.data?.data || [])
      setReports(rR.data?.data || []); setActivity(aR.data?.data || [])
      setSecurity(sR.data?.data || null); setLastRefreshed(new Date())
    } catch (err) { console.error("Dashboard fetch failed", err) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const t = setInterval(() => fetchData(true), 60000)
    return () => clearInterval(t)
  }, [fetchData])

  if (loading) return (
    <div className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-6 pb-20">
      <div className="h-52 w-full rounded-3xl bg-slate-200 dark:bg-white/5 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className="flex-1 p-4 md:p-8 min-h-screen pb-24 bg-slate-50 dark:bg-[#09090b]">
      <title>Organization Dashboard | Data Insight</title>
      <div className="max-w-[1800px] mx-auto space-y-6">
        <OrganizationHero
          overview={overview}
          kpis={kpis}
          lastRefreshed={lastRefreshed}
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
        />
        <OrganizationKpiGrid kpis={kpis} />
        <OrganizationScoreCards kpis={kpis} overview={overview} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OrganizationAnalytics chartData={charts} />
          </div>
          <OrganizationActivityFeed activity={activity} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrganizationDatasets datasets={datasets} />
          <OrganizationReports reports={reports} />
        </div>
        <OrganizationSecurity security={security} />
        <OrganizationNavStrip />
      </div>
    </div>
  )
}
