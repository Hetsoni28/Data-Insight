"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ViewerService } from "@/lib/viewer.service";
import type {
  ViewerDashboardOverview,
  ViewerReport,
  ViewerDashboard,
  ViewerDataset
} from "@/lib/viewer.service";

import { ViewerHero } from "@/components/organisms/ViewerHero";
import { ViewerKpiGrid } from "@/components/organisms/ViewerKpiGrid";
import { ViewerReportCenter } from "@/components/organisms/ViewerReportCenter";
import { ViewerDashboardCenter } from "@/components/organisms/ViewerDashboardCenter";
import { ViewerDatasetCenter } from "@/components/organisms/ViewerDatasetCenter";
import { ViewerAiAssistant } from "@/components/organisms/ViewerAiAssistant";
import { ViewerActivityFeed } from "@/components/organisms/ViewerActivityFeed";
import { ViewerNotifications } from "@/components/organisms/ViewerNotifications";

import { FileText, LayoutDashboard, Database, Brain, Activity, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ActiveTab = "reports" | "dashboards" | "datasets" | "activity";

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
        ViewerService.getDashboardOverview(activeWs.id),
        ViewerService.listReports(activeWs.id),
        ViewerService.listDashboards(activeWs.id),
        ViewerService.listDatasets(activeWs.id),
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
    <div className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
      {/* Top Welcome / Header */}
      <div className="flex items-center justify-between">
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
        <div className={cn("space-y-6 transition-all duration-300", isCopilotOpen ? "lg:col-span-8" : "lg:col-span-12")}>
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
                reports={reports}
                isLoading={loading}
                onRefresh={handleRefresh}
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
          <div className="lg:col-span-4 relative">
            <div className="sticky top-6 border border-slate-200/60 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Context Copilot</span>
                </div>
                <button
                  onClick={() => setIsCopilotOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Minimize
                </button>
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
        "flex items-center gap-2 px-4 py-3 text-sm font-semibold relative transition-all border-b-2",
        active
          ? "text-emerald-600 dark:text-emerald-400 border-emerald-500 font-bold"
          : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300"
      )}
    >
      <span className={active ? "text-emerald-500" : "text-slate-400"}>{icon}</span>
      {label}
      {count !== undefined && (
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 transition-all",
          active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
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
