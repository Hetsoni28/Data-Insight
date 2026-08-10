"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import api from "@/lib/api";

export function PlatformGrowthChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/owner/analytics/users");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to load user analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted) return <div className="w-full h-[300px] rounded-xl bg-slate-100 dark:bg-white/10 animate-pulse" />

  if (loading) {
    return <div className="h-full w-full bg-slate-100 dark:bg-white/10 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Platform Growth</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active Users & Organizations (Trailing 12 Months)</p>
        </div>
      </div>
      
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }} 
              dy={10} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }} 
              dx={-10}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: 12, opacity: 0.5 }} 
              dx={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                color: 'var(--card-foreground)'
              }}
              itemStyle={{ color: 'var(--foreground)' }}
              cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
            <Bar
              yAxisId="left"
              dataKey="active_users"
              name="Active Users"
              fill="#0ea5e9"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="active_orgs"
              name="Active Orgs"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
