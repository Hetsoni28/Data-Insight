"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Bookmark, BookmarkCheck, Eye, FileSpreadsheet, Loader2, Clock, Printer, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ViewerService } from "@/lib/viewer.service";
import type { ViewerReport } from "@/lib/viewer.service";
import { PaginationControls } from "@/components/molecules/PaginationControls";

interface ViewerReportExplorerProps {
  reports: ViewerReport[];
  isLoading: boolean;
  onRefresh: () => void;
  onPreview: (report: ViewerReport) => void;
}

const STATUS_STYLES: Record<string, string> = {
  ready:      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  approved:   "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  generating: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  queued:     "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  error:      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
};

export function ViewerReportExplorer({ reports, isLoading, onRefresh, onPreview }: ViewerReportExplorerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No reports found</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-md">
          There are no reports matching your filters, or no reports have been shared with you yet.
        </p>
        <Button onClick={onRefresh} variant="outline" className="mt-6">Clear Filters & Refresh</Button>
      </div>
    );
  }

  const totalPages = Math.ceil(reports.length / pageSize);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedReports = reports.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {paginatedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onRefresh={onRefresh}
              onPreview={() => onPreview(report)}
            />
          ))}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={reports.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 12, 24, 48]}
        />
      )}
    </div>
  );
}

function ReportCard({ report, onRefresh, onPreview }: {
  report: ViewerReport;
  onRefresh: () => void;
  onPreview: () => void;
}) {
  const [togglingBookmark, setTogglingBookmark] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canDownload = report.status === "ready" || report.status === "approved";

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingBookmark(true);
    try {
      const res = await ViewerService.toggleBookmark(report.id);
      toast.success(res.message);
      onRefresh(); // Trigger refresh to sync state
    } catch {
      toast.error("Could not update bookmark.");
    } finally {
      setTogglingBookmark(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDownload) return;
    setDownloading(true);
    try {
      const res = await ViewerService.downloadReport(report.id);
      if (res.download_url) {
        let url = res.download_url;
        if (url.startsWith("/api/v1/")) {
          const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:8000";
          url = `${backendBase}${url}`;
        }
        const a = document.createElement("a");
        a.href = url;
        a.download = report.title || "report";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started.");
      } else {
        toast.error("Download URL not available.");
      }
    } catch {
      toast.error("Could not generate download link.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      onClick={onPreview}
      className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden cursor-pointer flex flex-col justify-between h-[170px] hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-900/80"
    >
      {/* Decorative gradient blob on hover */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start gap-4 relative z-10">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shadow-inner group-hover:shadow-md transition-all">
          {report.report_type === "excel" ? (
            <FileSpreadsheet className="w-5 h-5 text-emerald-600/70 group-hover:text-emerald-600 transition-colors" />
          ) : (
            <FileText className="w-5 h-5 text-emerald-600/70 group-hover:text-emerald-600 transition-colors" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-[16px] leading-snug truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {report.title}
              </h3>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-wider", STATUS_STYLES[report.status] || STATUS_STYLES.queued)}>
                  {report.status === "generating" ? (
                    <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Generating</span>
                  ) : report.status}
                </span>
                <Badge variant="outline" className="text-[10px] h-[22px] px-2 font-semibold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm">
                  {report.category}
                </Badge>
                {report.department && (
                  <Badge variant="secondary" className="text-[10px] h-[22px] px-2 bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 shadow-sm">
                    {report.department}
                  </Badge>
                )}
              </div>
            </div>

            <button
              onClick={handleBookmark}
              disabled={togglingBookmark}
              className="flex-shrink-0 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:shadow-inner transition-all z-10 border border-transparent hover:border-amber-100 dark:hover:border-amber-500/20"
            >
              {togglingBookmark ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : report.is_bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500/20 drop-shadow-sm" />
              ) : (
                <Bookmark className="w-4 h-4 text-slate-300 hover:text-amber-500 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 relative z-10">
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {new Date(report.updated_at).toLocaleDateString()}</span>
          </div>
          {report.category === "AI" && (
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <Activity className="w-3.5 h-3.5" />
              <span>AI Generated</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {report.output_url && (
            <Button
              size="sm"
              variant="ghost"
              disabled={!canDownload || downloading}
              className="h-8 px-2.5 text-xs font-semibold text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 z-10 rounded-lg"
              onClick={handleDownload}
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 px-4 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm hover:shadow z-10 transition-all"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Preview
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
