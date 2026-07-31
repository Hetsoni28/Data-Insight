"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function AiExecutiveBriefing() {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-ai-overview"],
    queryFn: async () => (await api.get("/owner/ai/overview")).data,
  });

  if (isLoading) {
    return <Skeleton className="w-full h-48 rounded-xl mb-8" />;
  }

  if (!data) return null;

  // Simple rule-based logic to determine health status based on real data
  let status = "Excellent";
  let statusColor = "text-emerald-400";
  let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  
  if (data.success_rate < 95 || data.avg_latency > 2000) {
    status = "Warning";
    statusColor = "text-amber-400";
    icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
  }
  if (data.success_rate < 90 || data.avg_latency > 5000) {
    status = "Critical";
    statusColor = "text-rose-400";
    icon = <AlertTriangle className="w-5 h-5 text-rose-400" />;
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0A3A2A] border border-emerald-900/30 p-6 shadow-2xl mb-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <Sparkles className="w-48 h-48 text-white" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-md border border-emerald-500/30 text-emerald-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-widest">AI Operations Briefing</h2>
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            Platform AI Health is <span className={statusColor}>{status}</span>.
            {icon}
          </h3>
          
          <p className="text-emerald-100/80 leading-relaxed max-w-3xl">
            The platform has successfully processed <strong className="text-white">{new Intl.NumberFormat().format(data.total_requests)}</strong> AI requests 
            across <strong className="text-white">{data.active_organizations}</strong> active organizations. 
            Overall success rate is <strong className="text-white">{data.success_rate.toFixed(2)}%</strong> with an average 
            latency of <strong className="text-white">{data.avg_latency.toFixed(0)}ms</strong>. 
            Total AI infrastructure cost sits at <strong className="text-white">${data.total_cost.toFixed(2)}</strong>, 
            averaging <strong className="text-white">${data.average_cost_per_request.toFixed(4)}</strong> per request.
            {data.failed_requests > 0 && ` We observed ${data.failed_requests} failed requests that may require attention.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 min-w-[200px] shrink-0 w-full md:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-100/80">Success Rate</span>
            <span className="text-white font-bold flex items-center gap-1">
              {data.success_rate.toFixed(1)}% <TrendingUp className="w-3 h-3 text-emerald-400" />
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-100/80">Avg Latency</span>
            <span className="text-white font-bold flex items-center gap-1">
              {data.avg_latency.toFixed(0)}ms <TrendingDown className="w-3 h-3 text-emerald-400" />
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-100/80">Cost Efficiency</span>
            <span className="text-white font-bold flex items-center gap-1">
              Optimized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
