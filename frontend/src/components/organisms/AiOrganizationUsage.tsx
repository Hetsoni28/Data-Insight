"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { ArrowUpRight } from "lucide-react";

export function AiOrganizationUsage() {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-ai-organizations"],
    queryFn: async () => (await api.get("/owner/ai/organizations")).data,
  });

  if (isLoading) {
    return <Skeleton className="w-full h-[400px] rounded-xl mb-8" />;
  }

  if (!data?.data || data.data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-8 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top AI Consumers by Organization</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Organization</th>
              <th className="px-6 py-4 font-semibold text-right">Requests</th>
              <th className="px-6 py-4 font-semibold text-right">Total Tokens</th>
              <th className="px-6 py-4 font-semibold text-right">Avg Latency</th>
              <th className="px-6 py-4 font-semibold text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.data.map((org: any) => (
              <tr key={org.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                <td className="px-6 py-4 font-medium text-[#0A3A2A] dark:text-emerald-400 flex items-center gap-2">
                  {org.name}
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                  {new Intl.NumberFormat().format(org.requests)}
                </td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                  {new Intl.NumberFormat("en-US", { notation: "compact" }).format(org.tokens)}
                </td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                  {org.latency.toFixed(0)}ms
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                  ${org.cost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
