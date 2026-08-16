"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Plus, RefreshCw } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Dataset, DatasetService } from "@/lib/dataset.service";
import { Button } from "@/components/ui/button";
import { DatasetUploader } from "@/components/organisms/DatasetUploader";
import { DatasetTable } from "@/components/organisms/DatasetTable";

export default function DatasetsPage() {
  const { activeWs } = useWorkspaceStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const fetchDatasets = async () => {
    if (!activeWs?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await DatasetService.list(activeWs.id);
      setDatasets(data);
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [activeWs?.id]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchDatasets();
  };

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredDatasets = datasets.filter((ds) =>
    !search ||
    ds.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / pageSize));
  const paginatedDatasets = filteredDatasets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Datasets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your raw data files. AI will automatically profile and clean newly uploaded datasets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDatasets}
            disabled={isLoading || !activeWs}
            className="h-9 px-3 gap-2 rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowUploader(!showUploader)}
            className="h-9 px-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
            disabled={!activeWs}
          >
            {showUploader ? (
              "Cancel Upload"
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Upload Dataset
              </>
            )}
          </Button>
        </div>
      </div>

      {showUploader && activeWs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <DatasetUploader 
            workspaceId={activeWs.id} 
            onUploadComplete={handleUploadComplete} 
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DatasetTable 
          loading={isLoading}
          search={search}
          setSearch={setSearch}
          paginatedDatasets={paginatedDatasets}
          filteredCount={filteredDatasets.length}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
        />
      </motion.div>
    </div>
  );
}
