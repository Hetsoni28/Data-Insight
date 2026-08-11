"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsAnomaly as ViewerAnalyticsAnomalyType } from "@/lib/viewer-analytics.service";
import { Badge } from "@/components/ui/badge";

interface ViewerAnalyticsAnomaliesProps {
  anomalies: ViewerAnalyticsAnomalyType[];
  isLoading: boolean;
}

export function ViewerAnalyticsAnomalies({ anomalies, isLoading }: ViewerAnalyticsAnomaliesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!anomalies.length) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">No anomalies detected in the current data period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {anomalies.map((anomaly, i) => (
        <motion.div
          key={anomaly.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`relative overflow-hidden rounded-xl border p-4 ${
            anomaly.severity === 'high' 
              ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50' 
              : anomaly.severity === 'medium'
              ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
              : 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full mt-1 ${
              anomaly.severity === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'
              : anomaly.severity === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  {anomaly.metric} Anomaly
                  <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${
                    anomaly.severity === 'high' ? 'text-rose-600 border-rose-200' : 'text-amber-600 border-amber-200'
                  }`}>
                    {anomaly.severity} Severity
                  </Badge>
                </h4>
                <span className="text-xs text-slate-500">{new Date(anomaly.date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-3 mt-3 mb-2 bg-white/60 dark:bg-black/20 p-2 rounded-lg inline-flex">
                <div className="text-center px-2">
                  <p className="text-[10px] text-slate-500 uppercase">Expected</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{anomaly.expected_value.toLocaleString()}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className="text-center px-2">
                  <p className="text-[10px] text-slate-500 uppercase">Actual</p>
                  <p className={`font-bold ${anomaly.actual_value > anomaly.expected_value ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {anomaly.actual_value.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {anomaly.possible_explanation && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  <span className="font-medium">AI Diagnosis:</span> {anomaly.possible_explanation}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
