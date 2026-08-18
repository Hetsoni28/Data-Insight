"use client"
import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { motion } from "framer-motion"
import { OrganizationHero } from "@/components/organisms/OrganizationHero"
import { OrganizationKpiGrid } from "@/components/organisms/OrganizationKpiGrid"
import { OrganizationScoreCards } from "@/components/organisms/OrganizationScoreCards"
import { OrganizationAnalytics } from "@/components/organisms/OrganizationAnalytics"
import { OrganizationActivityFeed } from "@/components/organisms/OrganizationActivityFeed"
import { RecentDatasetsWidget } from "@/components/organisms/RecentDatasetsWidget"
import { OrganizationReports } from "@/components/organisms/OrganizationReports"
import { OrganizationSecurity } from "@/components/organisms/OrganizationSecurity"
import { OrganizationNavStrip } from "@/components/organisms/OrganizationNavStrip"

export default function OrganizationAdminDashboard() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient();

  const { data: overview, isLoading: loadingOverview } = useQuery({ queryKey: ['admin-overview'], queryFn: async () => (await api.get("/tenant-dashboard/overview")).data?.data });
  const { data: kpis, isLoading: loadingKpis } = useQuery({ queryKey: ['admin-kpis'], queryFn: async () => (await api.get("/tenant-dashboard/kpis")).data?.data });
  const { data: charts = [], isLoading: loadingCharts } = useQuery({ queryKey: ['admin-charts'], queryFn: async () => (await api.get("/tenant-dashboard/charts")).data?.data || [] });
  const { data: datasets = [], isLoading: loadingDatasets } = useQuery({ queryKey: ['admin-datasets'], queryFn: async () => (await api.get("/tenant-dashboard/datasets")).data?.data || [] });
  const { data: reports = [], isLoading: loadingReports } = useQuery({ queryKey: ['admin-reports'], queryFn: async () => (await api.get("/tenant-dashboard/reports")).data?.data || [] });
  const { data: activity = [], isLoading: loadingActivity } = useQuery({ queryKey: ['admin-activity'], queryFn: async () => (await api.get("/tenant-dashboard/activity")).data?.data || [] });
  const { data: security, isLoading: loadingSecurity } = useQuery({ queryKey: ['admin-security'], queryFn: async () => (await api.get("/tenant-dashboard/security")).data?.data || null });

  const loading = loadingOverview || loadingKpis || loadingCharts || loadingDatasets || loadingReports || loadingActivity || loadingSecurity;
  const refreshing = false;
  const lastRefreshed = new Date();

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    queryClient.invalidateQueries({ queryKey: ['admin-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['admin-charts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-datasets'] });
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    queryClient.invalidateQueries({ queryKey: ['admin-activity'] });
    queryClient.invalidateQueries({ queryKey: ['admin-security'] });
  };



  if (loading) return (
    <div className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-6 pb-20">
      <div className="h-56 w-full rounded-3xl bg-slate-200 dark:bg-white/5 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
        <div className="h-80 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse" />
      </div>
    </div>
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  }

  return (
    <div className="flex-1 p-4 md:p-8 min-h-screen pb-24 bg-slate-50 dark:bg-[#09090b] relative overflow-hidden">
      <title>Organization Dashboard | Data Insight</title>

      {/* Ambient Decorative Blurs */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-48 right-10 w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-[100px] opacity-50" />
        <div className="absolute top-96 left-10 w-[350px] h-[350px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[100px] opacity-40" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-[1800px] mx-auto space-y-6"
      >
        <motion.div variants={itemVariants}>
          <OrganizationHero
            overview={overview}
            kpis={kpis}
            lastRefreshed={lastRefreshed}
            refreshing={refreshing}
            onRefresh={() => fetchData()}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <OrganizationKpiGrid kpis={kpis} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <OrganizationScoreCards kpis={kpis} overview={overview} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OrganizationAnalytics chartData={charts} />
          </div>
          <OrganizationActivityFeed activity={activity} />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentDatasetsWidget datasets={datasets} basePath="/organization-admin/dashboard/datasets" />
          <OrganizationReports reports={reports} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <OrganizationSecurity security={security} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <OrganizationNavStrip />
        </motion.div>
      </motion.div>
    </div>
  )
}
