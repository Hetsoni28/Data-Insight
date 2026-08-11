"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsPerformance as ViewerAnalyticsPerformanceType } from "@/lib/viewer-analytics.service";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ViewerAnalyticsPerformanceProps {
  performances: ViewerAnalyticsPerformanceType[];
  isLoading: boolean;
}

export function ViewerAnalyticsPerformance({ performances, isLoading }: ViewerAnalyticsPerformanceProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!performances.length) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {performances.map((perf, i) => (
        <motion.div
          key={perf.dimension + i}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Top {perf.dimension}
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="h-64 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf.items} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {perf.items.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#4f46e5" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-3">
              {perf.items.slice(0, 3).map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.contribution}% total</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${item.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(item.growth)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
