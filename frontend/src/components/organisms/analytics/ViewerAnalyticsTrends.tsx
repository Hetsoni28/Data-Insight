"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsTrend as ViewerAnalyticsTrendType } from "@/lib/viewer-analytics.service";

interface ViewerAnalyticsTrendsProps {
  trends: ViewerAnalyticsTrendType[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function ViewerAnalyticsTrends({ trends, isLoading }: ViewerAnalyticsTrendsProps) {
  if (isLoading) {
    return <Skeleton className="w-full h-80 rounded-2xl" />;
  }

  if (!trends.length) return null;

  return (
    <div className="space-y-6">
      {trends.map((trend, i) => (
        <motion.div
          key={trend.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 relative overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {trend.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Timeline visualization over the selected period
              </p>
            </div>
          </div>
          
          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${trend.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis 
                  dataKey={trend.x_axis_key} 
                  tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={15}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.5 }}
                />
                <Area 
                  type="monotone" 
                  dataKey={trend.y_axis_key} 
                  stroke="#10b981" 
                  strokeWidth={3.5} 
                  fill={`url(#gradient-${trend.id})`}
                  activeDot={{ r: 6, fill: "#ffffff", stroke: "#10b981", strokeWidth: 3 }}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
