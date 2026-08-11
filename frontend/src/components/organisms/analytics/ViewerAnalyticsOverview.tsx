"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!kpis.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {kpi.title}
            </h3>
            <div className={cn(
              "p-1.5 rounded-md flex items-center justify-center",
              kpi.trend_direction === "up" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
              kpi.trend_direction === "down" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" :
              "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}>
              {kpi.trend_direction === "up" ? <TrendingUp className="w-4 h-4" /> :
               kpi.trend_direction === "down" ? <TrendingDown className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {kpi.value}
            </p>
            {kpi.percentage_change !== undefined && kpi.percentage_change !== null && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn(
                  "text-xs font-semibold",
                  kpi.trend_direction === "up" ? "text-emerald-600 dark:text-emerald-400" :
                  kpi.trend_direction === "down" ? "text-rose-600 dark:text-rose-400" :
                  "text-slate-500 dark:text-slate-400"
                )}>
                  {kpi.trend_direction === "up" && "+"}
                  {kpi.percentage_change}%
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  vs prev. period
                </span>
              </div>
            )}
          </div>
          
          {/* Sparkline simulation (pure css bars for minimalist look) */}
          {kpi.sparkline && kpi.sparkline.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end opacity-20 group-hover:opacity-40 transition-opacity">
              {kpi.sparkline.map((val, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex-1 mx-[1px] rounded-t-sm",
                    kpi.trend_direction === "up" ? "bg-emerald-500" :
                    kpi.trend_direction === "down" ? "bg-rose-500" :
                    "bg-slate-500"
                  )}
                  style={{ height: `${(val / Math.max(...kpi.sparkline)) * 100}%` }}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
