"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Eye, Download, FileSpreadsheet,
  CheckCircle2, AlertCircle, Loader2, Clock, Filter,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import type { ViewerReport } from "@/lib/viewer.service";

interface ViewerReportCenterProps {
  reports: ViewerReport[];
  isLoading: boolean;
  onRefresh: () => void;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  processing: <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />,
  failed:    <AlertCircle className="w-4 h-4 text-rose-500" />,
  pending:   <Clock className="w-4 h-4 text-slate-400" />,
};

export function ViewerReportCenter({ reports, isLoading, onRefresh }: ViewerReportCenterProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = reports.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedReports = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-xl shadow-emerald-500/5 overflow-hidden flex flex-col min-h-[500px] transition-all duration-300">
      <div className="p-5 border-b border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Report Archive
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access and view published intelligence reports
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Search reports..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 hidden sm:flex" onClick={onRefresh}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-auto flex flex-col">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <Skeleton key={i} className="w-full h-16 rounded-xl bg-slate-100 dark:bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">No reports found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              {search ? "Try adjusting your search terms." : "There are currently no reports available in this workspace."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 flex-1 content-start">
              <AnimatePresence>
                {paginatedReports.map((report) => (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={report.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-emerald-500/10 dark:border-emerald-500/10 bg-white/50 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20">
                        {report.report_type === 'csv' || report.report_type === 'excel' ? (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 text-sm md:text-base">
                          {report.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            {STATUS_ICON[report.status.toLowerCase()] || <Clock className="w-3.5 h-3.5" />}
                            <span className="capitalize">{report.status}</span>
                          </span>
                          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-medium">
                            {report.category}
                          </span>
                          <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center gap-2 pl-14 sm:pl-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 25, 50]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
