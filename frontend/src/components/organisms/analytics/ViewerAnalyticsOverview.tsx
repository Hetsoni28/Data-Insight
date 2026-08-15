"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { ViewerAnalyticsKpi as ViewerAnalyticsKpiType } from "@/lib/viewer-analytics.service";
import { cn } from "@/lib/utils";

interface ViewerAnalyticsOverviewProps {
  kpis: ViewerAnalyticsKpiType[];
  isLoading: boolean;
}

export function ViewerAnalyticsOverview({ kpis, isLoading }: ViewerAnalyticsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!kpis.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-start justify-between relative z-10">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {kpi.title}
            </h3>
            <div className={cn(
              "p-2 rounded-xl flex items-center justify-center transition-colors duration-300",
              kpi.trend_direction === "up" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20" :
              kpi.trend_direction === "down" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20" :
              "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {kpi.trend_direction === "up" ? <TrendingUp className="w-4 h-4" /> :
               kpi.trend_direction === "down" ? <TrendingDown className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
            </div>
          </div>
          
          <div className="mt-4 relative z-10">
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              {kpi.value}
            </p>
            {kpi.percentage_change !== undefined && kpi.percentage_change !== null && (
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-md",
                  kpi.trend_direction === "up" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                  kpi.trend_direction === "down" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" :
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                )}>
                  {kpi.trend_direction === "up" && "+"}
                  {kpi.percentage_change}%
                </span>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  vs last period
                </span>
              </div>
            )}
          </div>
          
          {/* SVG Sparkline */}
          {kpi.sparkline && kpi.sparkline.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpi.sparkline.map((val, i) => ({ value: val, index: i }))} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={kpi.trend_direction === "up" ? "#10b981" : kpi.trend_direction === "down" ? "#f43f5e" : "#64748b"} 
                    strokeWidth={2.5} 
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
