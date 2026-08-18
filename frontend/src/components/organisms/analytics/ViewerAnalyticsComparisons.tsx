"use client";
import React from "react";

import {  motion  } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsComparison as ViewerAnalyticsComparisonType } from "@/lib/analytics.service";

interface ViewerAnalyticsComparisonsProps {
  comparisons: ViewerAnalyticsComparisonType[];
  isLoading: boolean;
}

export const ViewerAnalyticsComparisons = React.memo(function ViewerAnalyticsComparisons({ comparisons, isLoading }: ViewerAnalyticsComparisonsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!comparisons.length) return null;

  return (
    <div className="flex flex-col gap-5">
      {comparisons.map((comp, i) => {
        const isUp = comp.trend === "up";
        const isDown = comp.trend === "down";
        const trendColor = isUp ? "text-emerald-600 dark:text-emerald-400" : isDown ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400";
        const trendBg = isUp ? "bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : isDown ? "bg-rose-50 dark:bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]" : "bg-slate-100 dark:bg-slate-800";
        const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

        return (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            {/* Hover accent glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-slate-400/10 transition-colors" />

            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{comp.title}</p>

            <div className="flex items-center gap-4">
              {/* Entity A */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">{comp.entity_a}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">{comp.value_a.toLocaleString()}</p>
              </div>

              {/* Trend Badge */}
              <div className={`flex flex-col items-center shrink-0 px-3 py-2 rounded-xl ${trendBg}`}>
                <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                <span className={`text-[11px] font-black mt-1 ${trendColor}`}>
                  {isUp ? "+" : ""}{comp.percentage_difference}%
                </span>
              </div>

              {/* Entity B */}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">{comp.entity_b}</p>
                <p className="text-2xl font-extrabold text-slate-400/80 dark:text-slate-600 tabular-nums tracking-tight">{comp.value_b.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/5 text-[13px] font-medium text-slate-500 flex justify-between items-center">
              <span>Absolute variance</span>
              <span className={`font-bold px-2 py-0.5 rounded-md ${isUp ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : isDown ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-white/5'}`}>
                {comp.absolute_difference > 0 ? "+" : ""}{comp.absolute_difference.toLocaleString()}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
