"use client";

import { motion } from "framer-motion";
import { Cpu, DollarSign, Activity, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

const fetchOverview = async () => {
  const res = await api.get("/owner/ai/overview");
  return res.data;
};

export function AiKpiGrid() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["owner-ai-overview"],
    queryFn: fetchOverview,
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-8 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        Failed to load AI operations data. Please check connection.
      </div>
    );
  }

  const kpis = [
    {
      title: "Total AI Requests",
      value: new Intl.NumberFormat().format(data.total_requests || 0),
      subtext: `${new Intl.NumberFormat().format(data.monthly_requests || 0)} this month`,
      icon: <Activity className="w-5 h-5" />,
      trend: "up",
    },
    {
      title: "Token Consumption",
      value: new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(data.total_tokens || 0),
      subtext: `Avg ${Math.round(data.average_tokens_per_request || 0)}/req`,
      icon: <Cpu className="w-5 h-5" />,
      trend: "up",
    },
    {
      title: "AI Infrastructure Cost",
      value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(data.total_cost || 0),
      subtext: `$${(data.average_cost_per_request || 0).toFixed(4)} avg per req`,
      icon: <DollarSign className="w-5 h-5" />,
      trend: "up",
    },
    {
      title: "Avg Latency",
      value: `${(data.avg_latency || 0).toFixed(0)}ms`,
      subtext: "Platform-wide average",
      icon: <Zap className="w-5 h-5" />,
      trend: "down",
    },
    {
      title: "Active Organizations",
      value: data.active_organizations || 0,
      subtext: "Consuming AI features",
      icon: <ShieldCheck className="w-5 h-5" />,
      trend: "up",
    },
    {
      title: "Success Rate",
      value: `${(data.success_rate || 0).toFixed(2)}%`,
      subtext: `${data.failed_requests || 0} failed requests`,
      icon: <ShieldCheck className="w-5 h-5" />,
      trend: (data.success_rate || 0) > 95 ? "up" : "down",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
        >
          {/* Subtle background glow effect on hover */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.title}</span>
              <div className={`p-1.5 rounded-md ${
                kpi.trend === 'up' && kpi.title !== 'Avg Latency' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                kpi.title === 'Avg Latency' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {kpi.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{kpi.value}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.subtext}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
