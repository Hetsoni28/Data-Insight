"use client";

import { motion } from "framer-motion";
import { LifeBuoy, CheckCircle2, Clock, Activity, Users, AlertCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
  delay: number;
}

function KpiCard({ title, value, trend, trendUp, icon: Icon, delay }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-emerald-500" />
      </div>
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400">
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold",
          trendUp ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
        )}>
          {trend}
        </span>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      </div>
    </motion.div>
  );
}

export function SupportKpiDashboard({ data }: { data: any }) {
  if (!data) return null;

  const kpis = [
    { title: "Open Tickets", value: data.kpis.openTickets, trend: data.trends.openTickets, trendUp: false, icon: LifeBuoy },
    { title: "Resolved Today", value: data.kpis.resolvedToday, trend: data.trends.resolvedToday, trendUp: true, icon: CheckCircle2 },
    { title: "Customer Satisfaction", value: data.kpis.csat, trend: data.trends.csat, trendUp: true, icon: Activity },
    { title: "AI Resolution Rate", value: data.kpis.aiResolutionRate, trend: data.trends.aiResolutionRate, trendUp: true, icon: Bot },
    { title: "Critical Incidents", value: data.kpis.activeIncidents, trend: "Stable", trendUp: true, icon: AlertCircle },
    { title: "Avg Resolution Time", value: data.kpis.avgResolutionTime, trend: "-15m", trendUp: true, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {kpis.map((kpi, i) => (
        <KpiCard key={kpi.title} {...kpi} delay={0.1 * i} />
      ))}
    </div>
  );
}
