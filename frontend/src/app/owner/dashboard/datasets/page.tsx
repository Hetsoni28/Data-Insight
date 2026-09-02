import dynamic from "next/dynamic"
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Plus, RefreshCw, Search, MoreVertical,
  Trash2, Eye, BarChart2, Upload, FileSpreadsheet,
  Clock, ShieldCheck, AlertTriangle, Cpu, ChevronRight,
  X, Loader2
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Dataset, DatasetService } from "@/lib/dataset.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { toast } from "sonner";



const DatasetUploader = dynamic(() => import('@/components/organisms/DatasetUploader').then(m => m.DatasetUploader), { ssr: false })

export default function OwnerDatasetsPage() {
  const { activeWs } = useWorkspaceStore();
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDatasets = async () => {
    if (!activeWs?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const data = await DatasetService.list(activeWs.id);
      setDatasets(data);
    } catch {
      toast.error("Failed to fetch datasets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDatasets(); }, [activeWs?.id]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchDatasets();
  };

  const handleDelete = async (ds: Dataset) => {
    if (!confirm(`Delete "${ds.name}"? This action cannot be undone.`)) return;
    setDeletingId(ds.id);
    try {
      await DatasetService.delete(ds.id);
      toast.success(`"${ds.name}" deleted successfully.`);
      fetchDatasets();
    } catch {
      toast.error("Failed to delete dataset.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDatasets = datasets.filter(
    (ds) => !search || ds.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / pageSize));
  const paginatedDatasets = filteredDatasets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalRows = datasets.reduce((sum, ds) => sum + (ds.row_count || 0), 0);
  const avgQuality = datasets.length
    ? Math.round(datasets.reduce((s, d) => s + (d.data_quality_score || 0), 0) / datasets.length)
    : 0;
  const highQuality = datasets.filter((d) => (d.data_quality_score || 0) >= 80).length;

  const statCards = [
    { label: "Total Datasets", value: datasets.length, icon: Database, color: "emerald", bg: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20" },
    { label: "Total Rows", value: totalRows.toLocaleString(), icon: FileSpreadsheet, color: "sky", bg: "from-sky-500/10 to-blue-500/10", border: "border-sky-500/20" },
    { label: "Avg. Quality", value: `${avgQuality}%`, icon: ShieldCheck, color: "violet", bg: "from-violet-500/10 to-purple-500/10", border: "border-violet-500/20" },
    { label: "High Quality", value: highQuality, icon: BarChart2, color: "amber", bg: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dataset Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Upload, manage, and monitor all datasets in this workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDatasets}
            disabled={isLoading || !activeWs}
            className="h-10 px-4 gap-2 rounded-xl border-slate-200 dark:border-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowUploader(!showUploader)}
            className="h-10 px-5 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 font-bold"
            disabled={!activeWs}
          >
            {showUploader ? (
              <><X className="h-4 w-4" /> Cancel</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Dataset</>
            )}
          </Button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5 backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Uploader Panel ── */}
      <AnimatePresence>
        {showUploader && activeWs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <DatasetUploader workspaceId={activeWs.id} onUploadComplete={handleUploadComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dataset Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden"
      >
        {/* Table Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              Your Datasets
              <Badge variant="secondary" className="ml-1 font-bold text-xs">
                {filteredDatasets.length}
              </Badge>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Full management access — upload, edit, delete and monitor.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search datasets..."
              className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-white/5">
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-6">Dataset</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-4">Status</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-4">Rows / Cols</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-4 w-[140px]">Quality</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 px-4">Last Updated</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-[240px] rounded-lg" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-md" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-28 rounded-md" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-24 rounded-md" /></td>
                    <td className="pr-6 py-4 text-right"><Skeleton className="h-9 w-28 ml-auto rounded-xl" /></td>
                  </tr>
                ))
              ) : paginatedDatasets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5 border border-slate-200 dark:border-white/10">
                        <Database className="w-9 h-9 text-slate-400" />
                      </div>
                      <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {search ? "No results found" : "No datasets yet"}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm text-center mb-6">
                        {search
                          ? `No datasets match "${search}".`
                          : "Upload your first dataset to get started. Our AI will automatically profile and clean it."}
                      </p>
                      {!search && (
                        <Button
                          onClick={() => setShowUploader(true)}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                        >
                          <Plus className="h-4 w-4" /> Upload Your First Dataset
                        </Button>
                      )}
                    </motion.div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginatedDatasets.map((ds, idx) => {
                    const quality = ds.data_quality_score || 0;
                    const qualityColor = quality >= 80 ? "bg-emerald-500" : quality >= 50 ? "bg-amber-500" : "bg-rose-500";
                    const qualityBadge = quality >= 80
                      ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                      : quality >= 50
                      ? "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                      : "text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
                    const isProcessing = ds.status === "processing";

                    return (
                      <motion.tr
                        key={ds.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Dataset Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              {isProcessing
                                ? <Cpu className="w-5 h-5 text-emerald-500 animate-pulse" />
                                : <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              }
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {ds.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5">
                                {ds.description || "No description provided"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {isProcessing ? (
                            <Badge className="gap-1.5 font-semibold bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                              <Loader2 className="w-3 h-3 animate-spin" /> Processing
                            </Badge>
                          ) : quality >= 80 ? (
                            <Badge className={`gap-1.5 font-semibold border ${qualityBadge}`}>
                              <ShieldCheck className="w-3 h-3" /> Healthy
                            </Badge>
                          ) : quality >= 50 ? (
                            <Badge className={`gap-1.5 font-semibold border ${qualityBadge}`}>
                              <AlertTriangle className="w-3 h-3" /> Needs Review
                            </Badge>
                          ) : (
                            <Badge className={`gap-1.5 font-semibold border ${qualityBadge}`}>
                              <AlertTriangle className="w-3 h-3" /> Poor Quality
                            </Badge>
                          )}
                        </td>

                        {/* Rows / Cols */}
                        <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {(ds.row_count || 0).toLocaleString()}
                          <span className="text-slate-400 font-normal mx-1">/</span>
                          {ds.column_count || 0}
                        </td>

                        {/* Quality Bar */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${qualityColor}`}
                                style={{ width: `${quality}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8 text-right">
                              {quality}%
                            </span>
                          </div>
                        </td>

                        {/* Last Updated */}
                        <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(ds.updated_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="pr-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/owner/dashboard/datasets/${ds.id}`}>
                              <Button
                                size="sm"
                                className="h-9 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-sm shadow-emerald-500/20 hover:shadow-md transition-all hover:scale-105 active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Manage
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                                  disabled={deletingId === ds.id}
                                >
                                  {deletingId === ds.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <MoreVertical className="w-4 h-4" />
                                  }
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200 dark:border-white/10">
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer"
                                  onClick={() => router.push(`/owner/dashboard/datasets/${ds.id}`)}
                                >
                                  <Eye className="w-4 h-4 text-slate-500" /> View &amp; Manage
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 cursor-pointer"
                                  onClick={() => handleDelete(ds)}
                                >
                                  <Trash2 className="w-4 h-4" /> Delete Dataset
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredDatasets.length > 0 && (
          <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDatasets.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 25, 50]}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
