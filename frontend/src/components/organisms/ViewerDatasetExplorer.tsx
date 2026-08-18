"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { TenantDashboardService } from "@/lib/tenant-dashboard.service"
import { ShieldCheck, Calendar, Database, Activity, Star, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { DatasetHeaderBanner } from "@/components/molecules/DatasetHeaderBanner"
import { DatasetMetricsGrid, DatasetMetric } from "@/components/organisms/DatasetMetricsGrid"
import { DatasetTable } from "@/components/organisms/DatasetTable"

export function ViewerDatasetExplorer() {
  const { data: user } = useAuth()
  const { activeWs } = useWorkspaceStore()
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (activeWs?.id) {
      setLoading(true)
      TenantDashboardService.listDatasets(activeWs.id)
        .then((data) => setDatasets(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [activeWs?.id])

  const filteredDatasets = datasets.filter((ds) =>
    ds.name.toLowerCase().includes(search.toLowerCase()) ||
    ds.department?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const paginatedDatasets = filteredDatasets.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredDatasets.length / pageSize) || 1

  const avgQuality = datasets.length ? datasets.reduce((acc, curr) => acc + (curr.data_quality_score || 0), 0) / datasets.length : 0

  const headerBadges = (
    <>
      <Badge variant="secondary" className="bg-white/10 text-emerald-50 border border-white/20 px-3.5 py-1.5 backdrop-blur-md rounded-xl shadow-sm">
        <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" />
        Enterprise Viewer
      </Badge>
      <span className="text-emerald-200/80 text-sm font-medium flex items-center bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
        <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </span>
    </>
  )

  const topMetrics: DatasetMetric[] = [
    {
      title: "Shared Datasets",
      value: loading ? "-" : datasets.length.toString(),
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      trend: 2,
      trendLabel: "vs last week",
    },
    {
      title: "Avg. Data Quality",
      value: loading ? "-" : `${Math.round(avgQuality)}%`,
      icon: <Activity className="w-5 h-5 text-emerald-500" />,
      trend: 5,
      trendLabel: "vs last month",
    },
    {
      title: "Favorite Datasets",
      value: loading ? "-" : "3",
      icon: <Star className="w-5 h-5 text-amber-500" />,
    },
    {
      title: "Recent Downloads",
      value: loading ? "-" : "12",
      icon: <Download className="w-5 h-5 text-purple-500" />,
      trend: -2,
      trendLabel: "vs last month",
    }
  ]

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto h-full overflow-y-auto pb-24">
      <DatasetHeaderBanner
        title="Dataset Explorer"
        description={<>Welcome back, {user?.full_name}. Securely explore, analyze, and query <span className="text-white font-bold">{datasets.length}</span> shared enterprise datasets in {activeWs?.name}.</>}
        badges={headerBadges}
      />

      <DatasetMetricsGrid metrics={topMetrics} />

      <DatasetTable 
        loading={loading}
        search={search}
        setSearch={setSearch}
        paginatedDatasets={paginatedDatasets}
        filteredCount={filteredDatasets.length}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        setPageSize={setPageSize}
      />
    </div>
  )
}
