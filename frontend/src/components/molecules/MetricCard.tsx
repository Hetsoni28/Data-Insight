"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  sparklineData?: any[];
  sparklineKey?: string;
  color?: "emerald" | "blue" | "rose" | "amber" | "violet";
  delay?: number;
}

export function MetricCard({
  title,
  value,
  trend = 0,
  trendLabel = "vs last 30d",
  icon,
  sparklineData = [],
  sparklineKey = "value",
  color = "emerald",
  delay = 0,
}: MetricCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  const TrendIcon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  const colorConfig = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      trendText: "text-emerald-600 dark:text-emerald-400",
      stroke: "#10b981",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      trendText: "text-blue-600 dark:text-blue-400",
      stroke: "#3b82f6",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      trendText: "text-rose-600 dark:text-rose-400",
      stroke: "#f43f5e",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      trendText: "text-amber-600 dark:text-amber-400",
      stroke: "#f59e0b",
    },
    violet: {
      bg: "bg-violet-50 dark:bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
      trendText: "text-violet-600 dark:text-violet-400",
      stroke: "#8b5cf6",
    },
  };

  const theme = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", theme.bg, theme.text)}>
            {icon}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
            <TrendIcon className={cn("h-3.5 w-3.5", isNeutral ? "text-slate-400" : isPositive ? "text-emerald-500" : "text-rose-500")} />
            <span className={cn("text-xs font-semibold", isNeutral ? "text-slate-500" : isPositive ? "text-emerald-600" : "text-rose-600")}>
              {Math.abs(trend)}%
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
          </div>
        </div>
      </div>

      {/* Background Sparkline */}
      {sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none">
          {!mounted ? (
            <div className="w-full h-[64px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.stroke} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={theme.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Area
                type="monotone"
                dataKey={sparklineKey}
                stroke={theme.stroke}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      )}
    </motion.div>
  );
}
