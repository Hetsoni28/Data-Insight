"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { ManagerAnalyticsService } from "@/lib/manager-analytics.service";
import { DatasetService } from "@/lib/dataset.service";
import type { Dataset } from "@/lib/dataset.service";
import type {
  ManagerAnalyticsKpi,
  ManagerAnalyticsTrend,
  ManagerAnalyticsPerformance,
  ManagerAnalyticsAnomaly,
} from "@/lib/manager-analytics.service";

import { ViewerAnalyticsOverview } from "./ViewerAnalyticsOverview";
import { ViewerAnalyticsTrends } from "./ViewerAnalyticsTrends";
import { ViewerAnalyticsPerformance } from "./ViewerAnalyticsPerformance";
import { ViewerAnalyticsAnomalies } from "./ViewerAnalyticsAnomalies";

import {
  Download,
  BookmarkPlus,
  Sparkles,
  Filter,
  Calendar,
  Database,
  RefreshCw,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ─── Shape adapters — map manager types → viewer component shapes ───────────

function adaptKpis(kpis: ManagerAnalyticsKpi[]) {
  return kpis.map((k) => ({
    id: k.id,
    title: k.title,
    value: k.is_currency
      ? `$${k.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : k.value.toLocaleString(undefined, { maximumFractionDigits: 1 }),
    trend_direction: k.trend as "up" | "down" | "neutral",
    percentage_change: k.change_pct,
    sparkline: [],
  }));
}

function adaptTrends(trends: ManagerAnalyticsTrend[]) {
  return trends.map((t) => ({
    ...t,
    x_axis_key: "date",
    y_axis_key: "value",
  }));
}

function adaptPerformances(performances: ManagerAnalyticsPerformance[]) {
  return performances.map((p) => ({
    ...p,
    items: p.items.map((item) => ({
      ...item,
      trend: "up" as const,
      growth: 0,
    })),
  }));
}

function adaptAnomalies(anomalies: ManagerAnalyticsAnomaly[]) {
  return anomalies.map((a) => ({
    ...a,
    date: a.date || new Date().toISOString(),
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ManagerAnalyticsCenter() {
  const { activeWs } = useWorkspaceStore();

  // Dataset selector
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedDatasetName, setSelectedDatasetName] = useState("Dataset");
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  // Page state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState("");

  // Analytics data
  const [kpis, setKpis] = useState<ManagerAnalyticsKpi[]>([]);
  const [trends, setTrends] = useState<ManagerAnalyticsTrend[]>([]);
  const [performances, setPerformances] = useState<ManagerAnalyticsPerformance[]>([]);
  const [anomalies, setAnomalies] = useState<ManagerAnalyticsAnomaly[]>([]);

  // Load datasets for this workspace
  useEffect(() => {
    if (!activeWs) return;
    const load = async () => {
      try {
        setLoadingDatasets(true);
        const ds = await DatasetService.list(activeWs.id);
        const ready = ds.filter((d) => d.status === "ready");
        setDatasets(ready);
        if (ready.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(ready[0].id);
          setSelectedDatasetName(ready[0].name);
        }
      } catch {
        toast.error("Failed to load datasets.");
      } finally {
        setLoadingDatasets(false);
      }
    };
    load();
  }, [activeWs]);

  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      if (!selectedDatasetId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [kpiRes, trendRes, perfRes, anomalyRes] = await Promise.all([
          ManagerAnalyticsService.getKpis(selectedDatasetId),
          ManagerAnalyticsService.getTrends(selectedDatasetId),
          ManagerAnalyticsService.getPerformance(selectedDatasetId),
          ManagerAnalyticsService.getAnomalies(selectedDatasetId),
        ]);

        setKpis(kpiRes.kpis);
        setTrends(trendRes.trends);
        setPerformances(perfRes.performances);
        setAnomalies(anomalyRes.anomalies);
        setLastRefresh(new Date().toLocaleTimeString());
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics for this dataset.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDatasetId]
  );

  useEffect(() => {
    if (selectedDatasetId) fetchAnalytics();
  }, [fetchAnalytics, selectedDatasetId]);

  const handleDatasetChange = (id: string) => {
    const ds = datasets.find((d) => d.id === id);
    setSelectedDatasetId(id);
    setSelectedDatasetName(ds?.name ?? "Dataset");
    setKpis([]);
    setTrends([]);
    setPerformances([]);
    setAnomalies([]);
  };

  // ── No workspace ──
  if (!activeWs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2">No Workspace Selected</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm">
          Please select a workspace from the sidebar to view analytics.
        </p>
      </div>
    );
  }

  const adaptedKpis = adaptKpis(kpis);
  const adaptedTrends = adaptTrends(trends);
  const adaptedPerformances = adaptPerformances(performances);
  const adaptedAnomalies = adaptAnomalies(anomalies);

  return (
    <div className="relative flex flex-col animate-in fade-in duration-500 space-y-8 pb-12 min-h-screen">
      {/* Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 rounded-3xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -translate-x-1/3" />
      </div>

      {/* ── Header (mirrors ViewerAnalyticsHeader) ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/manager/dashboard">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
            </Link>
            <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {activeWs?.name || "Workspace"}
            </Badge>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
              Dataset Analytics
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Analytics Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Deep-dive analytics for your managed datasets.{" "}
            {lastRefresh && `Last synchronized: ${lastRefresh}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || !selectedDatasetId}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md shadow-emerald-500/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Filters bar + Dataset selector ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 bg-slate-50/50 dark:bg-slate-900/20 px-4 rounded-xl border border-slate-100 dark:border-slate-800">
        {/* Dataset picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium whitespace-nowrap">
            <Database className="w-4 h-4" /> Dataset:
          </div>
          <div className="relative">
            <select
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
              value={selectedDatasetId || ""}
              onChange={(e) => handleDatasetChange(e.target.value)}
              disabled={loadingDatasets || datasets.length === 0}
            >
              {loadingDatasets ? (
                <option value="">Loading datasets…</option>
              ) : datasets.length === 0 ? (
                <option value="">No ready datasets</option>
              ) : (
                datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Refresh / Reset */}
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
          <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900">
            <Filter className="w-3.5 h-3.5 mr-2" /> More Filters
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing || !selectedDatasetId}
            className="text-slate-500"
          >
            <X className="w-3.5 h-3.5 mr-2" /> Reset
          </Button>
        </div>
      </div>

      {/* ── Error state ── */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-center">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-rose-800 dark:text-rose-300 mb-1">Analysis Failed</h3>
          <p className="text-sm text-rose-600 dark:text-rose-400 max-w-md">{error}</p>
        </div>

      ) : !selectedDatasetId ? (
        /* ── No dataset selected ── */
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Select a Dataset</h3>
          <p className="text-slate-500 max-w-md">
            Choose a ready dataset from the dropdown above to begin analysis.
          </p>
        </div>

      ) : (
        <>
          {/* ── KPI Overview ── */}
          <section>
            <ViewerAnalyticsOverview kpis={adaptedKpis as any} isLoading={loading} />
          </section>

          {!loading && kpis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No numeric columns found</h3>
              <p className="text-slate-500 max-w-md">
                This dataset has no detectable numeric metrics to analyze. Try uploading a dataset with numeric columns.
              </p>
            </div>
          ) : (
            <>
              {/* ── Trend Analysis + Anomalies row ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trend Analysis</h2>
                  <ViewerAnalyticsTrends trends={adaptedTrends as any} isLoading={loading} />
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Anomalies</h2>
                    <ViewerAnalyticsAnomalies anomalies={adaptedAnomalies as any} isLoading={loading} />
                  </div>
                </div>
              </div>

              {/* ── Segment Performance ── */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Segment Performance</h2>
                <ViewerAnalyticsPerformance performances={adaptedPerformances as any} isLoading={loading} />
              </section>

              {/* ── Dataset Info footer ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <Database className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-500">
                  Analyzing dataset:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedDatasetName}
                  </span>
                  {lastRefresh && (
                    <span className="ml-2 text-slate-400">— last refreshed {lastRefresh}</span>
                  )}
                </p>
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
}
