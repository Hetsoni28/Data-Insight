"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Search, Eye, Download, ChevronRight, Table,
  HardDrive, BarChart2, CheckCircle2, AlertCircle, Loader2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ViewerDataset } from "@/lib/viewer.service";
import { ViewerService } from "@/lib/viewer.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ViewerDatasetCenterProps {
  datasets: ViewerDataset[];
  isLoading: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  ready:    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  profiling: <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
  error:    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
  uploading: <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />,
};

function QualityBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-xs">N/A</span>;
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-7 text-right">{score}</span>
    </div>
  );
}

function SchemaModal({ dataset, onClose }: { dataset: ViewerDataset; onClose: () => void }) {
  const columns = Object.entries(dataset.schema_info || {});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{dataset.name} — Schema</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{columns.length} columns</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Column</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Nulls %</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Unique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {columns.map(([col, info]: [string, any]) => (
                <tr key={col} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-slate-800 dark:text-slate-200">{col}</td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className="text-[10px] font-semibold h-5 px-1.5">
                      {info?.type || info?.dtype || "string"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{info?.null_pct ?? "—"}%</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{info?.unique_count?.toLocaleString() ?? "—"}</td>
                </tr>
              ))}
              {columns.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-xs">No schema data. Dataset may still be profiling.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function DatasetCard({ dataset }: { dataset: ViewerDataset }) {
  const [showSchema, setShowSchema] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const sizeKb = dataset.file_size_bytes ? Math.round(dataset.file_size_bytes / 1024) : null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data } = await (await import("@/lib/api")).default.get(`/datasets/${dataset.id}/download-url`);
      window.open(data.download_url, "_blank");
      toast.success("Download link opened.");
    } catch {
      toast.error("Could not retrieve download link.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {showSchema && <SchemaModal dataset={dataset} onClose={() => setShowSchema(false)} />}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-5 hover:shadow-md transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{dataset.name}</h3>
                {dataset.description && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">{dataset.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 flex-shrink-0">
                {STATUS_ICON[dataset.status]}
                <span className="capitalize">{dataset.status}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Rows</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{dataset.row_count?.toLocaleString() ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Columns</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{dataset.column_count ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Size</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{sizeKb ? `${sizeKb} KB` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Owner</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{dataset.owner}</p>
              </div>
            </div>

            {/* Quality Score */}
            <div className="mt-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Data Quality</p>
              <QualityBar score={dataset.data_quality_score} />
            </div>

            {/* Meta + Actions */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated {new Date(dataset.updated_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:border-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
                  onClick={() => setShowSchema(true)}
                >
                  <Table className="w-3 h-3" /> View Schema
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  disabled={downloading}
                  onClick={handleDownload}
                >
                  {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export function ViewerDatasetCenter({ datasets, isLoading }: ViewerDatasetCenterProps) {
  const [search, setSearch] = useState("");

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5" id="datasets">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dataset Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} shared in this workspace
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets..."
            className="pl-8 h-8 text-sm w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">No datasets found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 max-w-xs">
            {search ? `No results for "${search}"` : "No datasets have been shared with this workspace yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <DatasetCard key={d.id} dataset={d} />
          ))}
        </div>
      )}
    </div>
  );
}
