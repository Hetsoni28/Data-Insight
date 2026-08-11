"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ManagerAnalyticsService } from "@/lib/manager-analytics.service";
import { DatasetService, Dataset } from "@/lib/dataset.service";
import type { 
  ManagerAnalyticsKpi as ManagerAnalyticsKpiType, 
  ManagerAnalyticsTrend as ManagerAnalyticsTrendType, 
  ManagerAnalyticsPerformance as ManagerAnalyticsPerformanceType,
  ManagerAnalyticsAnomaly as ManagerAnalyticsAnomalyType
} from "@/lib/manager-analytics.service";

import { ViewerAnalyticsOverview } from "./ViewerAnalyticsOverview";
import { ViewerAnalyticsTrends } from "./ViewerAnalyticsTrends";
import { ViewerAnalyticsPerformance } from "./ViewerAnalyticsPerformance";
import { ViewerAnalyticsAnomalies } from "./ViewerAnalyticsAnomalies";
import { RefreshCw, Database } from "lucide-react";

export function ManagerAnalyticsCenter() {
  const { activeWs } = useWorkspaceStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [kpis, setKpis] = useState<ManagerAnalyticsKpiType[]>([]);
  const [trends, setTrends] = useState<ManagerAnalyticsTrendType[]>([]);
  const [performances, setPerformances] = useState<ManagerAnalyticsPerformanceType[]>([]);
  const [anomalies, setAnomalies] = useState<ManagerAnalyticsAnomalyType[]>([]);
  const [lastRefresh, setLastRefresh] = useState("");

  useEffect(() => {
    if (!activeWs) return;
    const fetchDatasets = async () => {
      try {
        setLoadingDatasets(true);
        const ds = await DatasetService.list(activeWs.id);
        const readyDs = ds.filter(d => d.status === 'ready');
        setDatasets(readyDs);
        if (readyDs.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(readyDs[0].id);
        }
      } catch (e) {
        toast.error("Failed to load datasets.");
      } finally {
        setLoadingDatasets(false);
      }
    };
    fetchDatasets();
  }, [activeWs]);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!selectedDatasetId) return;
    
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [
        kpiRes, trendRes, perfRes, anomalyRes
      ] = await Promise.all([
        ManagerAnalyticsService.getKpis(selectedDatasetId),
        ManagerAnalyticsService.getTrends(selectedDatasetId),
        ManagerAnalyticsService.getPerformance(selectedDatasetId),
        ManagerAnalyticsService.getAnomalies(selectedDatasetId)
      ]);

      setKpis(kpiRes.kpis);
      setTrends(trendRes.trends);
      setPerformances(perfRes.performances);
      setAnomalies(anomalyRes.anomalies);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
      setError("Failed to load analytics for this dataset.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDatasetId]);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, selectedDatasetId]);

  if (!activeWs) {
    return (
      <div className="flex-1 p-6 lg:p-8 h-full overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Workspace Selected</h3>
          <p className="text-slate-500 max-w-md mb-6">
            You need an active workspace to view analytics. Please select or create a workspace using the sidebar menu.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 space-y-8 pb-12">
      
      {/* Header and Dataset Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Explore performance, trends, anomalies, and insights across your authorized business data.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <Database className="w-4 h-4 text-slate-500 ml-2" />
            <select 
              className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer pl-2 pr-8 py-1.5"
              value={selectedDatasetId || ""}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              disabled={loadingDatasets || datasets.length === 0}
            >
              {loadingDatasets ? (
                <option value="">Loading datasets...</option>
              ) : datasets.length === 0 ? (
                <option value="">No ready datasets</option>
              ) : (
                datasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              )}
            </select>
          </div>
          <button 
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || !selectedDatasetId}
            className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-center">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-rose-800 dark:text-rose-300 mb-1">Analysis Failed</h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 max-w-md">{error}</p>
        </div>
      ) : !selectedDatasetId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Select a Dataset</h3>
          <p className="text-slate-500 max-w-md">
            Please select an authorized dataset from the dropdown above to begin analysis.
          </p>
        </div>
      ) : (
        <>
          <section>
            <ViewerAnalyticsOverview kpis={kpis as any} isLoading={loading} />
          </section>

          {!loading && kpis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No numeric columns found</h3>
              <p className="text-slate-500 max-w-md">
                We couldn't automatically detect any numeric metrics in this dataset to analyze.
              </p>
            </div>
          ) : (
            <>
              {/* Trends & Comparisons Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trend Analysis</h2>
                  <ViewerAnalyticsTrends trends={trends as any} isLoading={loading} />
                </div>
                <div className="space-y-6">
                  <div className="mt-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Anomalies</h2>
                    <ViewerAnalyticsAnomalies anomalies={anomalies as any} isLoading={loading} />
                  </div>
                </div>
              </div>

              {/* Performance / Dimensions */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Segment Performance</h2>
                <ViewerAnalyticsPerformance performances={performances as any} isLoading={loading} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
