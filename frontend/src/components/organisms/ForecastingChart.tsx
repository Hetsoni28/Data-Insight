"use client";

import { useEffect, useState } from "react";
import { ComposedChart, Area, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import api from "@/lib/api";

export function ForecastingChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/owner/analytics/forecast");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to load forecast analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted) return <div className="w-full h-[300px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />

  if (loading) {
    return <div className="h-full w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            AI Revenue Forecast
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Predictive MRR modeling based on historical data.</p>
        </div>
        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          High Confidence
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }} 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                color: 'var(--card-foreground)'
              }}
              itemStyle={{ color: 'var(--foreground)' }}
              formatter={(value: any, name: any) => [
                `$${Number(value || 0).toLocaleString()}`, 
                name === "mrr_actual" ? "Actual MRR" : "Forecasted MRR"
              ]}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
            
            {/* Actual Data (Solid Area) */}
            <Area
              type="monotone"
              dataKey="mrr_actual"
              name="Actual MRR"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorActual)"
              activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
            />

            {/* Forecast Data (Dashed Line) */}
            <Line
              type="monotone"
              dataKey="mrr_forecast"
              name="Forecasted MRR"
              stroke="#0ea5e9"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#0ea5e9" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
