"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export function AiModelLeaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-ai-models"],
    queryFn: async () => (await api.get("/owner/ai/models")).data,
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[400px] rounded-xl mb-8" />;
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-6 shadow-sm mb-8 flex items-center justify-center h-48 text-slate-500">
        No model analytics available yet.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl shadow-sm mb-8 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Model Leaderboard & Quality</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold">Model Name</th>
              <th className="px-6 py-4 font-semibold text-right">Requests</th>
              <th className="px-6 py-4 font-semibold text-right">Tokens</th>
              <th className="px-6 py-4 font-semibold text-right">Avg Latency</th>
              <th className="px-6 py-4 font-semibold text-right">Total Cost</th>
              <th className="px-6 py-4 font-semibold text-right">Cost Efficiency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {data.data.map((model: any, idx: number) => {
              // Simple heuristic for efficiency tag
              let efficiency = "Optimal";
              let badgeColor = "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
              
              if (model.cost / (model.requests || 1) > 0.1) {
                efficiency = "Expensive";
                badgeColor = "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400";
              } else if (model.latency > 5000) {
                efficiency = "Slow";
                badgeColor = "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400";
              }

              return (
                <tr key={model.name} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-xs w-4">{idx + 1}.</span>
                    {model.name}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                    {new Intl.NumberFormat().format(model.requests)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                    {new Intl.NumberFormat("en-US", { notation: "compact" }).format(model.tokens)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end text-slate-500 dark:text-slate-400">
                      <Activity className="w-3.5 h-3.5 mr-1" />
                      {(model.latency || 0).toFixed(0)}ms
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                    ${(model.cost || 0).toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="secondary" className={`${badgeColor} border-none`}>
                      {efficiency}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
