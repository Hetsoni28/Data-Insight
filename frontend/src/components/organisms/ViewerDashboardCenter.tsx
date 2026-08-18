"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Maximize2, Download, Filter,
  TrendingUp, BarChart2, PieChart, Activity
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ViewerDashboard, DashboardChartWidget } from "@/lib/tenant-dashboard.service";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#10B981", "#059669", "#34D399", "#6EE7B7", "#A7F3D0", "#6366F1", "#8B5CF6", "#F59E0B"];

function KpiWidget({ widget }: { widget: DashboardChartWidget }) {
  const metrics = widget.metrics || {};
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{widget.title}</p>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">{metrics.value?.toLocaleString() ?? "—"}</div>
      {(metrics.min !== undefined || metrics.max !== undefined) && (
        <div className="flex gap-4 mt-2 text-xs text-slate-400">
          {metrics.min !== undefined && <span>Min: <span className="font-semibold text-slate-600 dark:text-slate-300">{metrics.min}</span></span>}
          {metrics.max !== undefined && <span>Max: <span className="font-semibold text-slate-600 dark:text-slate-300">{metrics.max}</span></span>}
          {metrics.median !== undefined && <span>Median: <span className="font-semibold text-slate-600 dark:text-slate-300">{metrics.median}</span></span>}
        </div>
      )}
    </div>
  );
}

function BarWidget({ widget }: { widget: DashboardChartWidget }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-emerald-500" />
        {widget.title}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={widget.data} margin={{ top: 5, right: 10, left: -15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineWidget({ widget }: { widget: DashboardChartWidget }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        {widget.title}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={widget.data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: "#059669", strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieWidget({ widget }: { widget: DashboardChartWidget }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-emerald-500" />
        {widget.title}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPie>
          <Pie data={widget.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} isAnimationActive={false}>
            {widget.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", fontSize: 12 }} />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}

function TextWidget({ widget }: { widget: DashboardChartWidget }) {
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 flex flex-col">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-500" />
        {widget.title}
      </p>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {widget.metrics?.text || "No insights generated for this widget."}
      </div>
    </div>
  );
}

function DashboardCard({ dashboard }: { dashboard: ViewerDashboard }) {
  const [expanded, setExpanded] = useState(false);
  
  const kpiWidgets = useMemo(() => (dashboard.widgets || []).filter((w) => w.type === "kpi"), [dashboard.widgets]);
  const chartWidgets = useMemo(() => (dashboard.widgets || []).filter((w) => w.type !== "kpi"), [dashboard.widgets]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      {/* Dashboard Header */}
      <div className="flex items-start justify-between p-5 bg-white/40 dark:bg-slate-900/40 border-b border-emerald-500/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{dashboard.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{dashboard.description}</p>
            <p className="text-[10px] text-slate-400 mt-1">Dataset: <span className="font-medium text-slate-600 dark:text-slate-300">{dashboard.dataset_name || "Unknown"}</span></p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <Maximize2 className="w-3.5 h-3.5 mr-1" />
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {/* KPI Summary Row */}
      {kpiWidgets.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-emerald-500/10 dark:bg-emerald-500/10">
          {kpiWidgets.map((w) => (
            <div key={w.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{w.title}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {w.metrics?.value?.toLocaleString() ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts (expandable) */}
      {expanded && chartWidgets.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5"
        >
          {chartWidgets.map((w) => {
            if (w.type === "bar") return <BarWidget key={w.id} widget={w} />;
            if (w.type === "line") return <LineWidget key={w.id} widget={w} />;
            if (w.type === "pie") return <PieWidget key={w.id} widget={w} />;
            if (w.type === "text") return <TextWidget key={w.id} widget={w} />;
            return null;
          })}
        </motion.div>
      )}

      {(dashboard.widgets || []).length === 0 && (
        <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No chart data available. The dataset may still be profiling.
        </div>
      )}
    </motion.div>
  );
}

import { PaginationControls } from "@/components/molecules/PaginationControls";

interface ViewerDashboardCenterProps {
  dashboards: ViewerDashboard[];
  isLoading: boolean;
}

export function ViewerDashboardCenter({ dashboards, isLoading }: ViewerDashboardCenterProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" id="dashboards">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dashboard Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Interactive read-only views compiled from your shared datasets
        </p>
      </div>

      {dashboards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No dashboards available</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 max-w-xs">
            Dashboards are generated automatically from uploaded datasets. No datasets are ready yet.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {dashboards
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((d) => (
                <DashboardCard key={d.id} dashboard={d} />
              ))}
          </div>
          {Math.ceil(dashboards.length / pageSize) > 1 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <PaginationControls
                currentPage={currentPage}
                totalPages={Math.ceil(dashboards.length / pageSize)}
                totalItems={dashboards.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
