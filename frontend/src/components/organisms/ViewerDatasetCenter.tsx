"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Search, Eye, Download, ChevronRight, Table,
  HardDrive, BarChart2, CheckCircle2, AlertCircle, Loader2, Clock,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ViewerDataset } from "@/lib/tenant-dashboard.service";
import { TenantDashboardService } from "@/lib/tenant-dashboard.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/molecules/PaginationControls";

interface ViewerDatasetCenterProps {
  datasets: ViewerDataset[];
  isLoading: boolean;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  ready:    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  profiling: <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />,
  error:    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
  uploading: <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />,
};

function QualityBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-xs">N/A</span>;
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shadow-inner">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-right">{score}%</span>
    </div>
  );
}

function SchemaModal({ dataset, onClose }: { dataset: ViewerDataset; onClose: () => void }) {
  const columns = Object.entries(dataset.schema_info || {});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-emerald-500/20 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="flex items-center justify-between p-6 border-b border-emerald-500/10">
          <div>
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Table className="w-6 h-6 text-emerald-500" />
              {dataset.name} — Schema
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{columns.length} columns detected in this dataset</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500">
             <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="overflow-y-auto flex-1 p-3">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl z-10">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider rounded-l-xl">Column Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Type</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nulls %</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider rounded-r-xl">Unique Values</th>
              </tr>
            </thead>
            <tbody>
              {columns.map(([col, info]: [string, any]) => (
                <tr key={col} className="bg-slate-50/50 dark:bg-white/5 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors group">
                  <td className="px-5 py-3 font-mono text-xs text-slate-800 dark:text-slate-200 rounded-l-xl font-medium">{col}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="text-[10px] font-semibold h-5 px-2.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:border-emerald-200 dark:group-hover:border-emerald-700">
                      {info?.type || info?.dtype || "string"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-400">{info?.null_pct ?? "—"}%</td>
                  <td className="px-5 py-3 text-xs font-medium text-slate-600 dark:text-slate-400 rounded-r-xl">{info?.unique_count?.toLocaleString() ?? "—"}</td>
                </tr>
              ))}
              {columns.length === 0 && (
                <tr><td colSpan={4} className="text-center py-16 text-slate-400 text-sm italic bg-slate-50/50 dark:bg-white/5 rounded-2xl">No schema data available. Dataset may still be profiling.</td></tr>
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-2xl p-6 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300 group relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base line-clamp-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors break-words">{dataset.name}</h3>
                {dataset.description && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-1">{dataset.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex-shrink-0 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                {STATUS_ICON[dataset.status]}
                <span className="capitalize">{dataset.status}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 mt-5 bg-slate-50/80 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 shadow-inner">
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rows</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">{dataset.row_count?.toLocaleString() ?? "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Columns</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">{dataset.column_count ?? "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Size</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">{sizeKb ? `${sizeKb >= 1024 ? (sizeKb/1024).toFixed(1)+' MB' : sizeKb+' KB'}` : "—"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Owner</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">{typeof (dataset.owner as any) === 'object' ? (dataset.owner as any)?.name || "—" : dataset.owner || "—"}</p>
              </div>
            </div>

            {/* Quality Score */}
            <div className="mt-5">
              <div className="flex justify-between items-end mb-1.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Data Quality Score</p>
              </div>
              <QualityBar score={dataset.data_quality_score} />
            </div>

            {/* Meta + Actions */}
            <div className="flex flex-wrap items-center justify-between mt-5 pt-4 border-t border-slate-200 dark:border-white/10 gap-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 min-w-0 flex-shrink">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Updated {new Date(dataset.updated_at).toLocaleDateString()}</span>
              </span>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors shadow-sm whitespace-nowrap"
                  onClick={() => setShowSchema(true)}
                >
                  <Table className="w-3.5 h-3.5 flex-shrink-0" /> Schema
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 transition-all hover:shadow-md hover:shadow-emerald-500/30 active:scale-95 whitespace-nowrap"
                  disabled={downloading}
                  onClick={handleDownload}
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : <Download className="w-3.5 h-3.5 flex-shrink-0" />}
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
           <Skeleton className="h-10 w-48 rounded-xl bg-white/40 dark:bg-slate-800/40" />
           <Skeleton className="h-10 w-72 rounded-xl bg-white/40 dark:bg-slate-800/40" />
        </div>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl bg-white/40 dark:bg-slate-800/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="datasets">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-emerald-500/20 backdrop-blur-xl shadow-lg shadow-emerald-500/5 transition-all">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            Dataset Center
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} securely shared in this workspace
          </p>
        </div>
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets by name or description..."
            className="pl-9 h-11 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl shadow-sm focus-visible:ring-emerald-500 transition-all font-medium"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm"
        >
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <Database className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No datasets found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-sm">
            {search ? `We couldn't find any datasets matching "${search}". Try adjusting your search.` : "No datasets have been shared with this workspace yet."}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((d) => (
                  <DatasetCard key={d.id} dataset={d} />
                ))}
            </AnimatePresence>
          </div>
          {Math.ceil(filtered.length / pageSize) > 1 && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
              <PaginationControls
                currentPage={currentPage}
                totalPages={Math.ceil(filtered.length / pageSize)}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[6, 12, 24, 48]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
