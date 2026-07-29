"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Database, Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Dataset, DatasetService } from "@/lib/dataset.service";
import { CopilotChat } from "@/components/organisms/CopilotChat";

export default function AICopilotPage() {
  const { activeWs } = useWorkspaceStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      if (!activeWs?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await DatasetService.list(activeWs.id);
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDatasetId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch datasets", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasets();
  }, [activeWs?.id]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-600" />
            AI Copilot
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Chat with your data. Ask questions in plain English to generate insights instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-slate-400" />
          {isLoading ? (
            <div className="h-9 w-48 bg-slate-100 rounded-md animate-pulse"></div>
          ) : (
            <select
              value={selectedDatasetId || ""}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="flex h-9 w-[250px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={datasets.length === 0}
            >
              {datasets.length === 0 ? (
                <option value="">No datasets available</option>
              ) : (
                datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0"
      >
        <CopilotChat datasetId={selectedDatasetId} />
      </motion.div>
    </div>
  );
}
