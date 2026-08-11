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
        forecast.historical_data.forEach(h => {
          combinedData.push({
            date: h.date,
            actual: h.value,
            predicted: null,
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
            className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-xl p-5 shadow-lg border border-indigo-500/20 text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{forecast.title}</h3>
                  <p className="text-xs text-indigo-300">Model Accuracy: {forecast.model_accuracy}%</p>
                </div>
              </div>
              <div className="text-xs px-2 py-1 bg-white/10 rounded-full border border-white/10">
                AI Prediction
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  
                  {/* Confidence Interval Area */}
                  <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(99, 102, 241, 0.15)" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(15, 23, 42, 1)" />
                  
                  {/* Actual Data Line */}
                  <Line type="monotone" dataKey="actual" name="Historical" stroke="#10b981" strokeWidth={3} dot={{r:3, fill: '#10b981', strokeWidth:0}} />
                  
                  {/* Predicted Data Line */}
                  <Line type="monotone" dataKey="predicted" name="Forecast" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" dot={{r:3, fill: '#818cf8', strokeWidth:0}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
