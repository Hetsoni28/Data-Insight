"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AiKpiGrid } from "@/components/organisms/AiKpiGrid";
import { AiExecutiveBriefing } from "@/components/organisms/AiExecutiveBriefing";
import { AiProviderAnalytics } from "@/components/organisms/AiProviderAnalytics";
import { AiModelLeaderboard } from "@/components/organisms/AiModelLeaderboard";
import { AiOrganizationUsage } from "@/components/organisms/AiOrganizationUsage";
import { AiActivityTimeline } from "@/components/organisms/AiActivityTimeline";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw, Settings } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api";

export default function OwnerAiDashboardPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing AI analytics...");
    await queryClient.invalidateQueries({ queryKey: ["owner-ai-overview"] });
    await queryClient.invalidateQueries({ queryKey: ["owner-ai-providers"] });
    await queryClient.invalidateQueries({ queryKey: ["owner-ai-trends"] });
    await queryClient.invalidateQueries({ queryKey: ["owner-ai-models"] });
    await queryClient.invalidateQueries({ queryKey: ["owner-ai-organizations"] });
    await queryClient.invalidateQueries({ queryKey: ["owner-ai-activity"] });
    setIsRefreshing(false);
    toast.success("AI Analytics are up to date.");
  };

  const handleExport = async () => {
    toast.info("Generating AI Usage CSV...");
    try {
      const res = await api.get("/owner/ai/models");
      const models = res.data?.data || [];
      const headers = ["Model", "Requests", "Tokens", "Cost", "Latency"];
      const csvRows = [headers.join(",")];
      models.forEach((m: any) => {
        csvRows.push([m.name, m.requests, m.tokens, m.cost, m.latency].join(","));
      });
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai_usage_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success("Export complete.");
    } catch (e) {
      toast.error("Failed to export data.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      {/* Top Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">AI Usage Intelligence</h1>
          <p className="text-slate-500 mt-1">
            Monitor every AI request, model, provider, token, cost, and performance metric across the Data Insight platform.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="outline" className="bg-white border-slate-200" disabled={isRefreshing}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleExport} variant="outline" className="bg-white border-slate-200">
            <Download className="w-4 h-4 mr-2" />
            Export Analytics
          </Button>
          <Button onClick={() => router.push("/owner/dashboard/settings")} className="bg-[#0A3A2A] hover:bg-[#06261c] text-white">
            <Settings className="w-4 h-4 mr-2" />
            AI Settings
          </Button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <AiKpiGrid />

      {/* Executive Summary */}
      <AiExecutiveBriefing />

      {/* Charts & Analytics */}
      <AiProviderAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AiModelLeaderboard />
          <AiOrganizationUsage />
        </div>
        <div>
          <AiActivityTimeline />
        </div>
      </div>
    </div>
  );
}
