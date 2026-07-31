"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { BrainCircuit, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AiActivityTimeline() {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-ai-activity"],
    queryFn: async () => (await api.get("/owner/ai/activity")).data,
    refetchInterval: 10000, // Live feed!
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[600px] rounded-xl mb-8" />;
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl text-center text-slate-500 mb-8">
        No recent AI activity found.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live AI Activity Feed</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time stream of platform-wide AI invocations.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="space-y-6">
        {data.data.map((act: any) => (
          <div key={act.id} className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                act.status >= 400 ? "bg-rose-100 text-rose-600" : "bg-[#0A3A2A]/10 text-[#0A3A2A]"
              }`}>
                {act.status >= 400 ? <AlertCircle className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
              </div>
              <div className="w-px h-full bg-slate-100 dark:bg-slate-800 group-last:bg-transparent mt-2" />
            </div>
            
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    <span className="font-semibold">{act.tenant}</span> invoked <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">{act.feature}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{act.model}</span>
                    <span>•</span>
                    <span>{act.tokens} tokens</span>
                    <span>•</span>
                    <span className={act.latency_ms > 4000 ? "text-amber-500" : ""}>{act.latency_ms.toFixed(0)}ms</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">${act.cost.toFixed(4)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(act.date), { addSuffix: true })}
                  </span>
                  {act.status === 200 ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-bold text-rose-500">HTTP {act.status}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
