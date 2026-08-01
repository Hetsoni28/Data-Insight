"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "@/lib/api";

export function RevenueTrendChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/owner/analytics/revenue");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to load revenue analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="h-full w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Growth</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Recurring Revenue (Trailing 12 Months)</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
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
              formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMrr)"
              activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
