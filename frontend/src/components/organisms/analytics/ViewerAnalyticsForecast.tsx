"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerAnalyticsForecast as ViewerAnalyticsForecastType } from "@/lib/viewer-analytics.service";
import { Zap } from "lucide-react";

interface ViewerAnalyticsForecastProps {
  forecasts: ViewerAnalyticsForecastType[];
  isLoading: boolean;
}

export function ViewerAnalyticsForecast({ forecasts, isLoading }: ViewerAnalyticsForecastProps) {
  if (isLoading) {
    return <Skeleton className="h-80 w-full rounded-xl" />;
  }

  if (!forecasts.length) return null;

  return (
    <div className="space-y-6">
      {forecasts.map((forecast, i) => {
        // Merge historical and predicted data into one timeline for Recharts
        const combinedData: any[] = [];
        
        // Add historical
        forecast.historical_data.forEach((h, idx) => {
          const isLast = idx === forecast.historical_data.length - 1;
          combinedData.push({
            date: h.date,
            actual: h.value,
            predicted: isLast ? h.value : null,
            lower: null,
            upper: null
          });
        });

        // Add predicted with confidence bounds
        forecast.predicted_data.forEach((p, idx) => {
          const conf = forecast.confidence_interval[idx];
          // If it's the very first prediction point, we can optionally connect it to the last actual point
          // for a smooth line, but we'll just plot them as a continuous timeline.
          combinedData.push({
            date: p.date,
            actual: null,
            predicted: p.value,
            lower: conf?.lower,
            upper: conf?.upper
          });
        });

        return (
          <motion.div
            key={forecast.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm relative overflow-hidden group"
          >
            {/* Animated AI Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-1000" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex-shrink-0">
                  <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{forecast.title}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Model Confidence: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{forecast.model_accuracy}%</span></p>
                </div>
              </div>
              <div className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-500/20 font-bold tracking-wide uppercase shadow-sm">
                AI Prediction
              </div>
            </div>

            <div className="h-80 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                    labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b', paddingTop: '15px' }} />
                  
                  {/* Confidence Interval Area */}
                  <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(99, 102, 241, 0.1)" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(255, 255, 255, 0.5)" className="dark:fill-slate-900/50" />
                  
                  {/* Actual Data Line */}
                  <Line type="monotone" dataKey="actual" name="Historical" stroke="#10b981" strokeWidth={3.5} dot={{r:4, fill: '#ffffff', stroke: '#10b981', strokeWidth:2}} />
                  
                  {/* Predicted Data Line */}
                  <Line type="monotone" dataKey="predicted" name="Forecast" stroke="#6366f1" strokeWidth={3.5} strokeDasharray="6 6" dot={{r:4, fill: '#ffffff', stroke: '#6366f1', strokeWidth:2}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
