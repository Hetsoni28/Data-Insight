"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsPerformance as ViewerAnalyticsPerformanceType } from "@/lib/viewer-analytics.service";
import { TrendingUp, TrendingDown, Star } from "lucide-react";

interface ViewerAnalyticsPerformanceProps {
  performances: ViewerAnalyticsPerformanceType[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-white/10 p-3 rounded-xl shadow-xl flex items-center gap-3">
        <div className="w-2 h-10 bg-emerald-500 rounded-full" />
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{data.name}</p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">
            {payload[0].value.toLocaleString()} <span className="text-sm font-medium text-slate-400">({data.contribution}% total)</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function ViewerAnalyticsPerformance({ performances, isLoading }: ViewerAnalyticsPerformanceProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-3xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  if (!performances.length) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {performances.map((perf, i) => (
        <motion.div
          key={perf.dimension + i}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden group"
        >
          {/* Subtle accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" />
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              Top {perf.dimension}
            </h3>
          </div>
          
          {/* Chart */}
          <div className="h-48 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf.items} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={90} 
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out">
                  {perf.items.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : index === 1 ? "#34d399" : "#64748b"} fillOpacity={index === 0 ? 1 : index === 1 ? 0.8 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked list */}
          <div className="flex flex-col gap-2">
            {perf.items.slice(0, 3).map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                key={item.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 shadow-sm hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                    idx === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" :
                    idx === 1 ? "bg-slate-100 text-slate-500 dark:bg-white/10" :
                    "bg-orange-50 text-orange-600 dark:bg-orange-500/10"
                  }`}>#{idx + 1}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.contribution}% total share</p>
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md ml-2 ${
                  item.trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                  item.trend === 'down' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' :
                  'bg-slate-100 text-slate-500 dark:bg-white/5'
                }`}>
                  {item.trend === 'up' ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : item.trend === 'down' ? <TrendingDown className="w-3 h-3 inline mr-0.5" /> : null}
                  {Math.abs(item.growth)}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
