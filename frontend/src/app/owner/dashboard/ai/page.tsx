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
    <div className="p-8 max-w-7xl mx-auto space-y-6 h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-violet-100 rounded-xl">
            <Brain className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Copilot
            </h1>
            <p className="text-sm text-slate-500">
              Chat directly with your datasets. Fast, secure, and intelligent.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm">
          <Database className="h-4 w-4 text-slate-400 ml-2" />
          {isLoading ? (
            <div className="h-9 w-48 bg-slate-100 rounded-md animate-pulse"></div>
          ) : (
            <select
              value={selectedDatasetId || ""}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="flex h-9 w-[250px] items-center justify-between rounded-md border-0 bg-transparent px-3 py-2 text-sm font-medium focus:outline-none focus:ring-0 cursor-pointer"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
        className="flex-1 min-h-0 relative"
      >
        <CopilotChat datasetId={selectedDatasetId} />
      </motion.div>
    </div>
  );
}
