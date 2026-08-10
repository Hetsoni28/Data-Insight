"use client";

import { useEffect, useState } from "react";
import { CopilotChat } from "@/components/organisms/CopilotChat";
import api from "@/lib/api";

export default function AnalystAICopilotPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/tenant-datasets")
      .then((res) => {
        const list = res.data?.data || [];
        setDatasets(list);
        if (list.length > 0) {
          setSelectedDatasetId(list[0].id);
        }
      })
      .catch((err) => console.error("Failed to load datasets", err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            AI Data Copilot
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Query datasets in natural language, generate visual metrics, and synthesize automated SQL queries.
          </p>
        </div>
      </div>

      <CopilotChat
        datasetId={selectedDatasetId}
        onDatasetChange={(id) => setSelectedDatasetId(id)}
        datasets={datasets}
      />
    </div>
  );
}
