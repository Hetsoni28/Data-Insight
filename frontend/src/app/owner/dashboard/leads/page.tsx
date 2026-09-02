import dynamic from "next/dynamic"
"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

const LeadsKpiGrid = dynamic(() => import('@/components/organisms/leads/LeadsKpiGrid').then(m => m.LeadsKpiGrid), { ssr: false })
const LeadsDataGrid = dynamic(() => import('@/components/organisms/leads/LeadsDataGrid').then(m => m.LeadsDataGrid), { ssr: false })
const LeadStatus = dynamic(() => import('@/components/organisms/leads/LeadDetailsDrawer').then(m => m.LeadStatus), { ssr: false })



export default function LeadsPipelinePage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all")
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ["owner-leads-stats"],
    queryFn: async () => (await api.get("/leads/stats")).data,
    staleTime: 30_000,
  })

  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ["owner-leads", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "50" })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      return (await api.get(`/leads/?${params}`)).data
    },
    staleTime: 30_000,
  })

  const leads = leadsData?.items ?? []

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["owner-leads"] }),
      qc.invalidateQueries({ queryKey: ["owner-leads-stats"] })
    ])
    setIsRefreshing(false)
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto min-h-screen relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Leads Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage inbound demo requests and track companies through the acquisition pipeline
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="rounded-xl border-slate-200/60 dark:border-white/10 text-xs font-bold w-fit hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          {isRefreshing || isLoading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Refresh Data
        </Button>
      </div>

      <LeadsKpiGrid 
        stats={stats} 
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
      />
      
      <LeadsDataGrid 
        data={leads} 
        isLoading={isLoading} 
        statusFilter={statusFilter} 
        search={search}
        setSearch={setSearch}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
