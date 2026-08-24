"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { AnalyticsService } from "@/lib/analytics.service";
import type { 
  AnalyticsKpi as ViewerAnalyticsKpiType, 
  AnalyticsTrend as ViewerAnalyticsTrendType, 
  AnalyticsPerformance as ViewerAnalyticsPerformanceType,
  AnalyticsComparison as ViewerAnalyticsComparisonType, 
  AnalyticsForecast as ViewerAnalyticsForecastType, 
  AnalyticsAnomaly as ViewerAnalyticsAnomalyType,
  AnalyticsInsight as ViewerAnalyticsInsightType
} from "@/lib/analytics.service";

import dynamic from "next/dynamic";

const ViewerAnalyticsHeader = dynamic<any>(() => import('./ViewerAnalyticsHeader').then(m => m.ViewerAnalyticsHeader), { ssr: false });
const ViewerAnalyticsFilters = dynamic<any>(() => import('./ViewerAnalyticsFilters').then(m => m.ViewerAnalyticsFilters), { ssr: false });
const ViewerAnalyticsOverview = dynamic<any>(() => import('./ViewerAnalyticsOverview').then(m => m.ViewerAnalyticsOverview), { ssr: false });
const ViewerAnalyticsTrends = dynamic<any>(() => import('./ViewerAnalyticsTrends').then(m => m.ViewerAnalyticsTrends), { ssr: false });
const ViewerAnalyticsPerformance = dynamic<any>(() => import('./ViewerAnalyticsPerformance').then(m => m.ViewerAnalyticsPerformance), { ssr: false });
const ViewerAnalyticsComparisons = dynamic<any>(() => import('./ViewerAnalyticsComparisons').then(m => m.ViewerAnalyticsComparisons), { ssr: false });
const ViewerAnalyticsForecast = dynamic<any>(() => import('./ViewerAnalyticsForecast').then(m => m.ViewerAnalyticsForecast), { ssr: false });
const ViewerAnalyticsAnomalies = dynamic<any>(() => import('./ViewerAnalyticsAnomalies').then(m => m.ViewerAnalyticsAnomalies), { ssr: false });
const ViewerAnalyticsAI = dynamic<any>(() => import('./ViewerAnalyticsAI').then(m => m.ViewerAnalyticsAI), { ssr: false });
import { Sparkles } from "lucide-react";


export function ViewerAnalyticsCenter() {
  const { activeWs } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Consolidated Data State to prevent multiple re-renders
  const [dashboardData, setDashboardData] = useState({
    domain: "General Business",
    kpis: [] as ViewerAnalyticsKpiType[],
    trends: [] as ViewerAnalyticsTrendType[],
    performances: [] as ViewerAnalyticsPerformanceType[],
    comparisons: [] as ViewerAnalyticsComparisonType[],
    forecasts: [] as ViewerAnalyticsForecastType[],
    anomalies: [] as ViewerAnalyticsAnomalyType[],
    aiInsights: [] as ViewerAnalyticsInsightType[],
    aiSummary: "",
    lastRefresh: ""
  });

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!activeWs) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel fetch for speed - using allSettled to prevent full-page crashes
      const results = await Promise.allSettled([
        AnalyticsService.getKpis(activeWs.id),
        AnalyticsService.getTrends(activeWs.id),
        AnalyticsService.getPerformance(activeWs.id),
        AnalyticsService.getComparisons(activeWs.id),
        AnalyticsService.getForecast(activeWs.id),
        AnalyticsService.getAnomalies(activeWs.id),
        AnalyticsService.getAiInsights(activeWs.id)
      ]);

      setDashboardData(prev => {
        const newData = { ...prev };
        if (results[0].status === 'fulfilled') {
          newData.domain = results[0].value.domain;
          newData.kpis = results[0].value.kpis;
        }
        if (results[1].status === 'fulfilled') newData.trends = results[1].value.trends;
        if (results[2].status === 'fulfilled') newData.performances = results[2].value.performances;
        if (results[3].status === 'fulfilled') newData.comparisons = results[3].value.comparisons;
        if (results[4].status === 'fulfilled') newData.forecasts = results[4].value.forecasts;
        if (results[5].status === 'fulfilled') newData.anomalies = results[5].value.anomalies;
        if (results[6].status === 'fulfilled') {
          newData.aiInsights = results[6].value.insights;
          newData.aiSummary = results[6].value.executive_summary;
        }
        newData.lastRefresh = new Date().toLocaleTimeString();
        return newData;
      });
    } catch (err: any) {
      console.error(err);
      setError("Failed to load analytics. You might not have access to the underlying datasets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWs?.id]);

  const { domain, kpis, trends, performances, comparisons, forecasts, anomalies, aiInsights, aiSummary, lastRefresh } = dashboardData;

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSaveView = useCallback(async () => {
    if (!activeWs) return;
    setSaving(true);
    try {
      await AnalyticsService.createSavedView(activeWs.id, `${dashboardData.domain} Default View`, { dateRange: "This Month" });
      toast.success("View saved to your personal preferences.");
    } catch (err) {
      toast.error("Failed to save view.");
    } finally {
      setSaving(false);
    }
  }, [activeWs, dashboardData.domain]);

  const aiSectionRef = useRef<HTMLDivElement>(null);
  const handleOpenAi = useCallback(() => {
    aiSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (!activeWs) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-7 h-7 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">No Workspace Selected</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm">
        Please select a workspace from the sidebar to view your analytics.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 space-y-8 pb-12">
      
      <ViewerAnalyticsHeader 
        domain={domain}
        lastRefresh={lastRefresh}
        onOpenAi={handleOpenAi}
        onSaveView={handleSaveView}
        isSaving={saving}
      />

      <ViewerAnalyticsFilters 
        onRefresh={() => fetchAnalytics(true)}
        isLoading={loading || refreshing}
      />

      {error ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-center">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-rose-800 dark:text-rose-300 mb-1">Access Denied</h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 max-w-md">{error}</p>
        </div>
      ) : (
        <>
          <section>
            <ViewerAnalyticsOverview kpis={kpis} isLoading={loading} />
          </section>

          {!loading && kpis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No analytics available</h3>
              <p className="text-slate-500 max-w-md">
                There are no datasets shared with you yet, or the shared datasets are still processing.
              </p>
            </div>
          ) : (
            <>
              {/* Trends — Full Width */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trend Analysis</h2>
                <ViewerAnalyticsTrends trends={trends} isLoading={loading} />
              </section>

              {/* 2-column: Period vs Period | Anomalies */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Period vs Period</h2>
                  <ViewerAnalyticsComparisons comparisons={comparisons} isLoading={loading} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Anomalies</h2>
                  <ViewerAnalyticsAnomalies anomalies={anomalies} isLoading={loading} />
                </div>
              </div>

              {/* Segment Performance — Full Width */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Segment Performance</h2>
                <ViewerAnalyticsPerformance performances={performances} isLoading={loading} />
              </section>

              {/* Forecasting — Full Width */}
              {(loading || forecasts.length > 0) && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Forecasting</h2>
                  <ViewerAnalyticsForecast forecasts={forecasts} isLoading={loading} />
                </section>
              )}

              {/* AI Insights — Full Width */}
              <section className="space-y-6 pt-4" ref={aiSectionRef}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" /> Executive Business Insights
                </h2>
                <ViewerAnalyticsAI 
                  insights={aiInsights} 
                  summary={aiSummary} 
                  isLoading={loading} 
                />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
