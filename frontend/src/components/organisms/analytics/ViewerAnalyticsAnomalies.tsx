"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Zap, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsAnomaly as ViewerAnalyticsAnomalyType } from "@/lib/viewer-analytics.service";

interface ViewerAnalyticsAnomaliesProps {
  anomalies: ViewerAnalyticsAnomalyType[];
  isLoading: boolean;
}

export function ViewerAnalyticsAnomalies({ anomalies, isLoading }: ViewerAnalyticsAnomaliesProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
      </div>
    );
  }

  if (!anomalies.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center"
      >
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Zap className="w-6 h-6 text-emerald-500" />
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-1">All Systems Nominal</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">No statistical anomalies detected in the current data period.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {anomalies.map((anomaly, i) => (
        <motion.div
          key={anomaly.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15, duration: 0.4, ease: "easeOut" }}
          className="group relative"
        >
          {/* Animated Glow Backdrop */}
          <div className={`absolute -inset-0.5 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 ${
            anomaly.severity === 'high' ? 'bg-rose-400' : 
            anomaly.severity === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
          }`} />

          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                  anomaly.severity === 'high' ? 'bg-rose-500' : 
                  anomaly.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className={`relative p-3 rounded-2xl flex items-center justify-center ${
                  anomaly.severity === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 
                  anomaly.severity === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 
                  'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                      {anomaly.metric} Spike
                      <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md ${
                        anomaly.severity === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </h4>
                    <span className="text-xs font-medium text-slate-500">{new Date(anomaly.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                
                {/* Data Shift Visualizer */}
                <div className="flex items-center gap-4 mt-4 mb-3 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5 inline-flex w-full">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expected</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-lg">{anomaly.expected_value.toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center justify-center">
                    <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    <span className={`text-[10px] font-bold ${anomaly.actual_value > anomaly.expected_value ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {Math.abs(Math.round(((anomaly.actual_value - anomaly.expected_value) / anomaly.expected_value) * 100))}%
                    </span>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Actual</p>
                    <p className={`font-black text-xl ${anomaly.actual_value > anomaly.expected_value ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {anomaly.actual_value.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {anomaly.possible_explanation && (
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/20 text-sm text-emerald-900 dark:text-emerald-200">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <p className="leading-relaxed font-medium">
                      {anomaly.possible_explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
