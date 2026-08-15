"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsComparison as ViewerAnalyticsComparisonType } from "@/lib/viewer-analytics.service";

interface ViewerAnalyticsComparisonsProps {
  comparisons: ViewerAnalyticsComparisonType[];
  isLoading: boolean;
}

export function ViewerAnalyticsComparisons({ comparisons, isLoading }: ViewerAnalyticsComparisonsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!comparisons.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {comparisons.map((comp, i) => {
        const isUp = comp.trend === "up";
        const isDown = comp.trend === "down";
        const trendColor = isUp ? "text-emerald-600" : isDown ? "text-rose-500" : "text-slate-400";
        const trendBg = isUp ? "bg-emerald-50 dark:bg-emerald-500/10" : isDown ? "bg-rose-50 dark:bg-rose-500/10" : "bg-slate-100 dark:bg-slate-800";
        const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

        return (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{comp.title}</p>

            <div className="flex items-center gap-3">
              {/* Entity A */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-400 mb-0.5">{comp.entity_a}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{comp.value_a.toLocaleString()}</p>
              </div>

              {/* Trend Badge */}
              <div className={`flex flex-col items-center shrink-0 px-2 py-1.5 rounded-lg ${trendBg}`}>
                <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                <span className={`text-[11px] font-bold mt-0.5 ${trendColor}`}>
                  {isUp ? "+" : ""}{comp.percentage_difference}%
                </span>
              </div>

              {/* Entity B */}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[11px] text-slate-400 mb-0.5">{comp.entity_b}</p>
                <p className="text-xl font-bold text-slate-400 dark:text-slate-500 tabular-nums">{comp.value_b.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between">
              <span>Absolute variance</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {comp.absolute_difference > 0 ? "+" : ""}{comp.absolute_difference.toLocaleString()}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
