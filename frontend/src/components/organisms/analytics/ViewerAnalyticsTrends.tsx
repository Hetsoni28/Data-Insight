"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsTrend as ViewerAnalyticsTrendType } from "@/lib/viewer-analytics.service";

interface ViewerAnalyticsTrendsProps {
  trends: ViewerAnalyticsTrendType[];
  isLoading: boolean;
}

export function ViewerAnalyticsTrends({ trends, isLoading }: ViewerAnalyticsTrendsProps) {
  if (isLoading) {
    return <Skeleton className="w-full h-80 rounded-xl" />;
  }

  if (!trends.length) return null;

  return (
    <div className="space-y-6">
      {trends.map((trend, i) => (
        <motion.div
          key={trend.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {trend.title}
            </h3>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey={trend.x_axis_key} 
                  tick={{ fontSize: 12, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "#64748b" }} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={trend.y_axis_key} 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }} 
                  activeDot={{ r: 6, fill: "#4f46e5", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
