"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { DashboardChartData } from '@/lib/tenantDashboard.service';

interface AnalystActivityChartProps {
  charts?: DashboardChartData[];
  isLoading: boolean;
}

const ChartSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 h-[420px] animate-pulse flex flex-col shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
    </div>
    <div className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
  </div>
);

export function AnalystActivityChart({ charts, isLoading }: AnalystActivityChartProps) {
  const [range, setRange] = useState<'30D' | '7D'>('30D');

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
    );
  }

  const displayedCharts = range === '7D' ? (charts || []).slice(-7) : (charts || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="lg:col-span-2"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all h-[420px] flex flex-col relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Activity Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Real-time analytics generation log
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => setRange('30D')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                range === '30D'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setRange('7D')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                range === '7D'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0 relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedCharts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700/60 text-xs">
                        <p className="text-slate-400 font-semibold mb-1">{data.full_date || data.date}</p>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-bold text-emerald-400">Reports Generated:</span>
                          <span className="font-extrabold text-white">{data.reports}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#10b981', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="reports"
                name="Reports Generated"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEmerald)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
