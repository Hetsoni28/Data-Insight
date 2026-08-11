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
      // Parallel fetch for speed
      const [
        kpiRes, trendRes, perfRes, compRes, 
        forecastRes, anomalyRes, insightRes
      ] = await Promise.all([
        ViewerAnalyticsService.getKpis(activeWs.id),
        ViewerAnalyticsService.getTrends(activeWs.id),
        ViewerAnalyticsService.getPerformance(activeWs.id),
        ViewerAnalyticsService.getComparisons(activeWs.id),
        ViewerAnalyticsService.getForecast(activeWs.id),
        ViewerAnalyticsService.getAnomalies(activeWs.id),
        ViewerAnalyticsService.getAiInsights(activeWs.id)
      ]);

      setDomain(kpiRes.domain);
      setKpis(kpiRes.kpis);
      setTrends(trendRes.trends);
      setPerformances(perfRes.performances);
      setComparisons(compRes.comparisons);
      setForecasts(forecastRes.forecasts);
      setAnomalies(anomalyRes.anomalies);
      setAiInsights(insightRes.insights);
      setAiSummary(insightRes.executive_summary);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      setError("Failed to load analytics. You might not have access to the underlying datasets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeWs]);

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

  if (!activeWs) return null;

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
              {/* Trends & Comparisons Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trend Analysis</h2>
                  <ViewerAnalyticsTrends trends={trends} isLoading={loading} />
                </div>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Period vs Period</h2>
                  <ViewerAnalyticsComparisons comparisons={comparisons} isLoading={loading} />
                  
                  <div className="mt-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Anomalies</h2>
                    <ViewerAnalyticsAnomalies anomalies={anomalies} isLoading={loading} />
                  </div>
                </div>
              </div>

              {/* Performance / Dimensions */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Segment Performance</h2>
                <ViewerAnalyticsPerformance performances={performances} isLoading={loading} />
              </section>

              {/* Forecasting */}
              {forecasts.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Forecasting</h2>
                  <ViewerAnalyticsForecast forecasts={forecasts} isLoading={loading} />
                </section>
              )}

              {/* AI Insights & Assistant */}
              <section className="space-y-6 pt-6" ref={aiSectionRef}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Executive Business Insights
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
