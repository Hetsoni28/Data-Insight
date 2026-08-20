"use client";
import React from "react";

import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsPerformance as ViewerAnalyticsPerformanceType } from "@/lib/analytics.service";
import { TrendingUp, TrendingDown, Star } from "lucide-react";

interface ViewerAnalyticsPerformanceProps {
  performances: ViewerAnalyticsPerformanceType[];
  isLoading: boolean;
}

const CARD_PALETTES = [
  { accent: "from-emerald-400 to-teal-500",    bar0: "#10b981", bar1: "#34d399", bar2: "#6ee7b7", tooltipBar: "bg-emerald-500", hoverBorder: "hover:border-emerald-400/40", cursor: "rgba(16,185,129,0.06)"  },
  { accent: "from-violet-500 to-purple-600",   bar0: "#7c3aed", bar1: "#a78bfa", bar2: "#c4b5fd", tooltipBar: "bg-violet-500",  hoverBorder: "hover:border-violet-400/40",  cursor: "rgba(124,58,237,0.06)" },
  { accent: "from-amber-400 to-orange-500",    bar0: "#f59e0b", bar1: "#fbbf24", bar2: "#fcd34d", tooltipBar: "bg-amber-500",   hoverBorder: "hover:border-amber-400/40",   cursor: "rgba(245,158,11,0.06)" },
  { accent: "from-rose-400 to-pink-500",       bar0: "#f43f5e", bar1: "#fb7185", bar2: "#fda4af", tooltipBar: "bg-rose-500",    hoverBorder: "hover:border-rose-400/40",    cursor: "rgba(244,63,94,0.06)"  },
];

const makeTooltip = (palette: typeof CARD_PALETTES[0]) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-white/10 p-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className={`w-2 h-10 ${palette.tooltipBar} rounded-full`} />
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{data.name}</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {typeof payload[0].value === "number" ? payload[0].value.toLocaleString() : payload[0].value}{" "}
              <span className="text-sm font-medium text-slate-400">({data.contribution}% share)</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  CustomTooltip.displayName = "CustomTooltip";
  return CustomTooltip;
};

export const ViewerAnalyticsPerformance = React.memo(function ViewerAnalyticsPerformance({ performances, isLoading }: ViewerAnalyticsPerformanceProps) {
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
      {performances.map((perf, i) => {
        const palette = CARD_PALETTES[i % CARD_PALETTES.length];
        const TooltipComponent = makeTooltip(palette);

        return (
          <motion.div
            key={perf.dimension + i}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
            className={`bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden group transition-all duration-300 ${palette.hoverBorder}`}
          >
            {/* Unique accent line per card */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${palette.accent} opacity-90`} />

            <div className="flex items-center justify-between mb-6 mt-1">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400/30" />
                Top {perf.dimension}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-full">
                {perf.items.length} segments
              </span>
            </div>

            {/* Bar Chart */}
            <div className="h-44 w-full mb-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf.items} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={88}
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.length > 11 ? v.slice(0, 11) + "..." : v}
                  />
                  <Tooltip content={<TooltipComponent />} cursor={{ fill: palette.cursor }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} isAnimationActive={true} animationDuration={1200} animationEasing="ease-out">
                    {perf.items.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? palette.bar0 : index === 1 ? palette.bar1 : palette.bar2}
                        fillOpacity={index === 0 ? 1 : index === 1 ? 0.85 : 0.5}
                      />
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 shadow-sm transition-all ${palette.hoverBorder}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                      idx === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20" :
                      idx === 1 ? "bg-slate-100 text-slate-500 dark:bg-white/10" :
                      "bg-orange-50 text-orange-500 dark:bg-orange-500/10"
                    }`}>#{idx + 1}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.contribution}% total share</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md ml-2 flex items-center gap-0.5 ${
                    item.trend === "up"   ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
                    item.trend === "down" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" :
                    "bg-slate-100 text-slate-500 dark:bg-white/5"
                  }`}>
                    {item.trend === "up"   ? <TrendingUp className="w-3 h-3" /> :
                     item.trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
                    {item.growth != null ? Math.abs(item.growth) : 0}%
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
