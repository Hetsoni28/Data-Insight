import dynamic from "next/dynamic"
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { TenantDashboardService } from "@/lib/tenant-dashboard.service";
import type {
  ViewerDashboardOverview,
  ViewerReport,
  ViewerDashboard,
  ViewerDataset
} from "@/lib/tenant-dashboard.service";


import { FileText, LayoutDashboard, Database, Brain, Activity, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/atoms/Logo";



type ActiveTab = "reports" | "dashboards" | "datasets" | "activity";

const ViewerHero = dynamic(() => import('@/components/organisms/ViewerHero').then(m => m.ViewerHero), { ssr: false })
const ViewerKpiGrid = dynamic(() => import('@/components/organisms/ViewerKpiGrid').then(m => m.ViewerKpiGrid), { ssr: false })
const ViewerReportCenter = dynamic(() => import('@/components/organisms/reports/ViewerReportCenter').then(m => m.ViewerReportCenter), { ssr: false })
const ViewerDashboardCenter = dynamic(() => import('@/components/organisms/ViewerDashboardCenter').then(m => m.ViewerDashboardCenter), { ssr: false })
const ViewerDatasetCenter = dynamic(() => import('@/components/organisms/ViewerDatasetCenter').then(m => m.ViewerDatasetCenter), { ssr: false })
const ViewerAiAssistant = dynamic(() => import('@/components/organisms/ViewerAiAssistant').then(m => m.ViewerAiAssistant), { ssr: false })
const ViewerActivityFeed = dynamic(() => import('@/components/organisms/ViewerActivityFeed').then(m => m.ViewerActivityFeed), { ssr: false })
const ViewerNotifications = dynamic(() => import('@/components/organisms/ViewerNotifications').then(m => m.ViewerNotifications), { ssr: false })

export default function ViewerDashboardPage() {
  const { data: user } = useAuth();
  const { activeWs } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("reports");
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);

  // States
  const [overview, setOverview] = useState<ViewerDashboardOverview | null>(null);
  const [reports, setReports] = useState<ViewerReport[]>([]);
  const [dashboards, setDashboards] = useState<ViewerDashboard[]>([]);
  const [datasets, setDatasets] = useState<ViewerDataset[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!activeWs?.id) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewResult, reportsResult, dashboardsResult, datasetsResult] = await Promise.allSettled([
        TenantDashboardService.getDashboardOverview(activeWs.id),
        TenantDashboardService.listReports(activeWs.id),
        TenantDashboardService.listDashboards(activeWs.id),
        TenantDashboardService.listDatasets(activeWs.id),
      ]);

      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value);
      if (reportsResult.status === "fulfilled") setReports(reportsResult.value.items || []);
      if (dashboardsResult.status === "fulfilled") setDashboards(dashboardsResult.value);
      if (datasetsResult.status === "fulfilled") setDatasets(datasetsResult.value);
    } catch (error) {
      console.error("Failed to load viewer dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWs?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  if (!activeWs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <LoaderComponent />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-4">No Workspace Selected</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm">
          Please select or create a workspace using the workspace switcher in the sidebar to access your viewer dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-24 relative min-h-screen overflow-x-hidden">
      {/* Premium Ambient Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] opacity-70" />
        <div className="absolute top-[40%] -right-[5%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] opacity-50" />
      </div>

      {/* Top Welcome / Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Research Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Read-only secure intelligence interface
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="h-9 gap-1.5"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Hero Identity Banner */}
      <ViewerHero
        welcome={overview?.welcome}
        isLoading={loading}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* KPI Stats Bar */}
      <ViewerKpiGrid
        kpis={overview?.kpis}
        isLoading={loading}
      />

      {/* Main Content Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Viewer Browsers */}
        <div className={cn("space-y-6 transition-all duration-300 min-w-0 overflow-hidden", isCopilotOpen ? "lg:col-span-8" : "lg:col-span-12")}>
          {/* Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-1">
            <div className="flex gap-2">
              <TabButton
                active={activeTab === "reports"}
                onClick={() => setActiveTab("reports")}
                icon={<FileText className="w-4 h-4" />}
                label="Reports"
                count={reports.length}
              />
              <TabButton
                active={activeTab === "dashboards"}
                onClick={() => setActiveTab("dashboards")}
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Dashboards"
                count={dashboards.length}
              />
              <TabButton
                active={activeTab === "datasets"}
                onClick={() => setActiveTab("datasets")}
                icon={<Database className="w-4 h-4" />}
                label="Datasets"
                count={datasets.length}
              />
              <TabButton
                active={activeTab === "activity"}
                onClick={() => setActiveTab("activity")}
                icon={<Activity className="w-4 h-4" />}
                label="Feed & Alerts"
              />
            </div>

            {!isCopilotOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCopilotOpen(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              >
                <Brain className="w-3.5 h-3.5" />
                Open AI Panel
              </Button>
            )}
          </div>

          {/* Render Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "reports" && (
              <ViewerReportCenter
                workspaceId={activeWs?.id ?? ""}
              />
            )}
            {activeTab === "dashboards" && (
              <ViewerDashboardCenter
                dashboards={dashboards}
                isLoading={loading}
              />
            )}
            {activeTab === "datasets" && (
              <ViewerDatasetCenter
                datasets={datasets}
                isLoading={loading}
              />
            )}
            {activeTab === "activity" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ViewerActivityFeed
                  activities={(overview?.recent_activity as any) || []}
                  isLoading={loading}
                />
                <ViewerNotifications
                  notifications={(overview?.unread_notifications as any) || []}
                  isLoading={loading}
                  onRefresh={handleRefresh}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Copilot Panel */}
        {isCopilotOpen && (
          <div className="lg:col-span-4">
            <div className="sticky top-6 border border-emerald-500/20 dark:border-emerald-500/20 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl p-5 space-y-4 shadow-2xl shadow-emerald-500/10 transition-all duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Logo size={14} showText={false} href={null} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Context Copilot</span>
                </div>
              </div>

              <ViewerAiAssistant
                datasets={datasets}
                isLoading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold relative transition-all rounded-full overflow-hidden",
        active
          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20"
          : "text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <span className={cn("relative z-10", active ? "text-emerald-500" : "text-slate-400")}>{icon}</span>
      <span className="relative z-10">{label}</span>
      {count !== undefined && (
        <span className={cn(
          "relative z-10 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 transition-all",
          active ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400" : "bg-slate-200/50 text-slate-500 dark:bg-white/10 dark:text-slate-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function LoaderComponent() {
  return (
    <div className="flex gap-1 items-center justify-center">
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
    </div>
  );
}
