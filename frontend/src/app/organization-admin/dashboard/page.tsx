"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { OrganizationHero } from "@/components/organisms/OrganizationHero"
import { OrganizationKpiGrid } from "@/components/organisms/OrganizationKpiGrid"
import { OrganizationQuickActions } from "@/components/organisms/OrganizationQuickActions"
import { OrganizationAnalytics } from "@/components/organisms/OrganizationAnalytics"
import { OrganizationDatasets } from "@/components/organisms/OrganizationDatasets"
import { OrganizationReports } from "@/components/organisms/OrganizationReports"
import { OrganizationSecurity } from "@/components/organisms/OrganizationSecurity"
import { OrganizationActivityFeed } from "@/components/organisms/OrganizationActivityFeed"

export default function OrganizationAdminDashboard() {
  const router = useRouter()
  const { data: user } = useAuth()
  
  const [overview, setOverview] = useState<any>(null)
  const [kpis, setKpis] = useState<any>(null)
  const [charts, setCharts] = useState<any>(null)
  const [datasets, setDatasets] = useState<any>(null)
  const [reports, setReports] = useState<any>(null)
  const [activity, setActivity] = useState<any>(null)
  const [security, setSecurity] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [
        overviewRes,
        kpisRes,
        chartsRes,
        datasetsRes,
        reportsRes,
        activityRes,
        securityRes
      ] = await Promise.all([
        api.get('/tenant-dashboard/overview'),
        api.get('/tenant-dashboard/kpis'),
        api.get('/tenant-dashboard/charts'),
        api.get('/tenant-dashboard/datasets'),
        api.get('/tenant-dashboard/reports'),
        api.get('/tenant-dashboard/activity'),
        api.get('/tenant-dashboard/security')
      ])
      
      setOverview(overviewRes.data)
      setKpis(kpisRes.data)
      setCharts(chartsRes.data)
      setDatasets(datasetsRes.data)
      setReports(reportsRes.data)
      setActivity(activityRes.data)
      setSecurity(securityRes.data)
    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-8 pb-20">
        <div className="h-64 w-full rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-96 w-full rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-[#09090b] min-h-screen pb-24">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* 1. Hero Welcome Banner */}
        <OrganizationHero overview={overview?.data} user={user} />

        {/* 2. Executive KPI Cards */}
        <OrganizationKpiGrid kpis={kpis?.data} />

        {/* 3. Quick Actions */}
        <OrganizationQuickActions />

        {/* 4. Business Analytics (Charts) */}
        <OrganizationAnalytics chartData={charts?.data} />

        {/* 5. Datasets & Reports Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <OrganizationDatasets datasets={datasets?.data} />
          <OrganizationReports reports={reports?.data} />
        </div>

        {/* 6. Security & Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <OrganizationSecurity security={security?.data} />
          </div>
          <div>
            <OrganizationActivityFeed activity={activity?.data} />
          </div>
        </div>
      </div>
    </div>
  )
}
