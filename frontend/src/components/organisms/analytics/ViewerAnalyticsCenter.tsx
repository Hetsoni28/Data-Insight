"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ViewerAnalyticsService } from "@/lib/viewer-analytics.service";
import type { 
  ViewerAnalyticsKpi as ViewerAnalyticsKpiType, ViewerAnalyticsTrend as ViewerAnalyticsTrendType, ViewerAnalyticsPerformance as ViewerAnalyticsPerformanceType,
  ViewerAnalyticsComparison as ViewerAnalyticsComparisonType, ViewerAnalyticsForecast as ViewerAnalyticsForecastType, ViewerAnalyticsAnomaly as ViewerAnalyticsAnomalyType,
  ViewerAnalyticsInsight as ViewerAnalyticsInsightType
} from "@/lib/viewer-analytics.service";

import { ViewerAnalyticsHeader } from "./ViewerAnalyticsHeader";
import { ViewerAnalyticsFilters } from "./ViewerAnalyticsFilters";
import { ViewerAnalyticsOverview } from "./ViewerAnalyticsOverview";
import { ViewerAnalyticsTrends } from "./ViewerAnalyticsTrends";
import { ViewerAnalyticsPerformance } from "./ViewerAnalyticsPerformance";
import { ViewerAnalyticsComparisons } from "./ViewerAnalyticsComparisons";
import { ViewerAnalyticsForecast } from "./ViewerAnalyticsForecast";
import { ViewerAnalyticsAnomalies } from "./ViewerAnalyticsAnomalies";
import { ViewerAnalyticsAI } from "./ViewerAnalyticsAI";
import { Sparkles } from "lucide-react";


export function ViewerAnalyticsCenter() {
  const { activeWs } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [domain, setDomain] = useState("General Business");
  const [kpis, setKpis] = useState<ViewerAnalyticsKpiType[]>([]);
  const [trends, setTrends] = useState<ViewerAnalyticsTrendType[]>([]);
  const [performances, setPerformances] = useState<ViewerAnalyticsPerformanceType[]>([]);
  const [comparisons, setComparisons] = useState<ViewerAnalyticsComparisonType[]>([]);
  const [forecasts, setForecasts] = useState<ViewerAnalyticsForecastType[]>([]);
  const [anomalies, setAnomalies] = useState<ViewerAnalyticsAnomalyType[]>([]);
  const [aiInsights, setAiInsights] = useState<ViewerAnalyticsInsightType[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!activeWs) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel fetch for speed - using allSettled to prevent full-page crashes
      const results = await Promise.allSettled([
        ViewerAnalyticsService.getKpis(activeWs.id),
        ViewerAnalyticsService.getTrends(activeWs.id),
        ViewerAnalyticsService.getPerformance(activeWs.id),
        ViewerAnalyticsService.getComparisons(activeWs.id),
        ViewerAnalyticsService.getForecast(activeWs.id),
        ViewerAnalyticsService.getAnomalies(activeWs.id),
        ViewerAnalyticsService.getAiInsights(activeWs.id)
      ]);

      if (results[0].status === 'fulfilled') {
        setDomain(results[0].value.domain);
        setKpis(results[0].value.kpis);
      }
      if (results[1].status === 'fulfilled') setTrends(results[1].value.trends);
      if (results[2].status === 'fulfilled') setPerformances(results[2].value.performances);
      if (results[3].status === 'fulfilled') setComparisons(results[3].value.comparisons);
      if (results[4].status === 'fulfilled') setForecasts(results[4].value.forecasts);
      if (results[5].status === 'fulfilled') setAnomalies(results[5].value.anomalies);
      if (results[6].status === 'fulfilled') {
        setAiInsights(results[6].value.insights);
        setAiSummary(results[6].value.executive_summary);
      }
      
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        throw new Error("All analytics endpoints failed to load.");
      }
      
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      setError("Failed to load analytics. You might not have access to the underlying datasets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWs?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSaveView = async () => {
    if (!activeWs) return;
    setSaving(true);
    try {
      await ViewerAnalyticsService.createSavedView(`${domain} Default View`, { dateRange: "This Month" }, activeWs.id);
      toast.success("View saved to your personal preferences.");
    } catch (err) {
      toast.error("Failed to save view.");
    } finally {
      setSaving(false);
    }
  };

  const aiSectionRef = useRef<HTMLDivElement>(null);
  const handleOpenAi = () => {
    aiSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
