"use client";
import dynamic from "next/dynamic"

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { tenantDashboardService } from "@/lib/tenantDashboard.service";
import { DatasetService } from "@/lib/dataset.service";
import { motion } from "framer-motion";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";



const ManagerHero = dynamic(() => import('@/components/organisms/ManagerHero').then(m => m.ManagerHero), { ssr: false })
const ManagerKpiGrid = dynamic(() => import('@/components/organisms/ManagerKpiGrid').then(m => m.ManagerKpiGrid), { ssr: false })
const RecentDatasetsWidget = dynamic(() => import('@/components/organisms/RecentDatasetsWidget').then(m => m.RecentDatasetsWidget), { ssr: false })
const ManagerReports = dynamic(() => import('@/components/organisms/ManagerReports').then(m => m.ManagerReports), { ssr: false })
const ManagerActivityFeed = dynamic(() => import('@/components/organisms/ManagerActivityFeed').then(m => m.ManagerActivityFeed), { ssr: false })
const ManagerQuickActions = dynamic(() => import('@/components/organisms/ManagerQuickActions').then(m => m.ManagerQuickActions), { ssr: false })

export default function ManagerDashboardPage() {
  const { data: user } = useAuth();
  const { activeWs } = useWorkspaceStore();

  const queryClient = useQueryClient();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['manager-overview', activeWs?.id],
    queryFn: () => tenantDashboardService.getOverview(),
    enabled: !!activeWs?.id,
  });

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['manager-kpis', activeWs?.id],
    queryFn: () => tenantDashboardService.getKpis(),
    enabled: !!activeWs?.id,
  });

  const { data: datasetsRes, isLoading: loadingDatasets } = useQuery({
    queryKey: ['manager-datasets-list', activeWs?.id],
    queryFn: () => DatasetService.list(activeWs!.id),
    enabled: !!activeWs?.id,
  });
  const datasets = datasetsRes as any;

  const { data: reportsRes, isLoading: loadingReports } = useQuery({
    queryKey: ['manager-reports-list', activeWs?.id],
    queryFn: () => tenantDashboardService.getReports(0, 5),
    enabled: !!activeWs?.id,
  });
  const reports = (reportsRes as any)?.data || (reportsRes as any)?.items || (Array.isArray(reportsRes) ? reportsRes : []);

  const { data: activityRes, isLoading: loadingActivity } = useQuery({
    queryKey: ['manager-activity', activeWs?.id],
    queryFn: () => tenantDashboardService.getActivity(0, 10),
    enabled: !!activeWs?.id,
  });
  const activity = (activityRes as any)?.data || (activityRes as any)?.items || (Array.isArray(activityRes) ? activityRes : []);

  const loading = loadingOverview || loadingKpis || loadingDatasets || loadingReports || loadingActivity;
  const refreshing = false; // Background fetch handled by React Query

  const loadData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['manager-overview'] });
    queryClient.invalidateQueries({ queryKey: ['manager-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['manager-datasets-list'] });
    queryClient.invalidateQueries({ queryKey: ['manager-reports-list'] });
    queryClient.invalidateQueries({ queryKey: ['manager-activity-list'] });
  }, [queryClient]);

  const handleRefresh = () => {
    loadData();
  };

  if (!activeWs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-4">No Workspace Selected</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">
          Please select or create a workspace using the workspace switcher in the sidebar.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-24 min-h-screen">
      {/* Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 rounded-[3rem]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute top-[40%] left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -translate-x-1/3" />
      </div>

      {/* Top Welcome / Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-between relative z-10"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview and controls for your managed workspace
          </p>
        </div>
        <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadData()}
              disabled={refreshing}
              className={cn("h-10 px-4 gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200/60 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 transition-all rounded-none shadow-sm")}
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <ManagerHero overview={overview} user={user} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <ManagerKpiGrid kpis={kpis} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">Quick Actions</h2>
        <ManagerQuickActions />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-8"
      >
        <div className="space-y-8">
          <RecentDatasetsWidget datasets={datasets} basePath="/manager/dashboard/datasets" />
          <ManagerReports reports={reports} />
        </div>
        <div>
          <ManagerActivityFeed activity={activity} />
        </div>
      </motion.div>
    </div>
  );
}
