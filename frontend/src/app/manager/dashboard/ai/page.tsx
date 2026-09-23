"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useWorkspaceStore } from "@/store/workspaceStore";

const CopilotChat = dynamic(
  () => import("@/components/organisms/CopilotChat").then((m) => m.CopilotChat),
  { ssr: false }
);

export default function ManagerAICopilotPage() {
  const { activeWs } = useWorkspaceStore();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  const fetchDatasets = useCallback(async () => {
    if (!activeWs) return;
    setLoadingDatasets(true);
    try {
      const res = await api.get("/tenant-datasets");
      const list: any[] = res.data?.data ?? res.data ?? [];
      setDatasets(list);
      if (list.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load datasets", err);
    } finally {
      setLoadingDatasets(false);
    }
  }, [activeWs?.id]);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <title>AI Assistant | Manager | Data Insight</title>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Data Copilot
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore workspace datasets, generate custom visual reports, and summarize business KPIs.
          </p>
        </div>
      </div>

      {loadingDatasets ? (
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      ) : datasets.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          No datasets available yet. Upload a dataset to start chatting with your data.
        </div>
      ) : (
        <CopilotChat
          datasetId={selectedDatasetId}
          onDatasetChange={(id) => setSelectedDatasetId(id)}
          datasets={datasets}
        />
      )}
    </div>
  );
}
