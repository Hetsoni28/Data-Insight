"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsComparison as ViewerAnalyticsComparisonType } from "@/lib/viewer-analytics.service";

interface ViewerAnalyticsComparisonsProps {
  comparisons: ViewerAnalyticsComparisonType[];
  isLoading: boolean;
}

export function ViewerAnalyticsComparisons({ comparisons, isLoading }: ViewerAnalyticsComparisonsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  if (!comparisons.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {comparisons.map((comp, i) => (
        <motion.div
          key={comp.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{comp.title}</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">{comp.entity_a}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{comp.value_a.toLocaleString()}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center px-4">
              <div className={`p-1.5 rounded-full mb-1 ${comp.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {comp.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-bold ${comp.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {comp.trend === 'up' ? '+' : ''}{comp.percentage_difference}%
              </span>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">{comp.entity_b}</p>
              <p className="text-xl font-bold text-slate-400 dark:text-slate-500">{comp.value_b.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
            Absolute variance: <span className="font-semibold text-slate-700 dark:text-slate-300">{comp.absolute_difference > 0 ? '+' : ''}{comp.absolute_difference.toLocaleString()}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
