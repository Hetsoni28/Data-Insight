"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { History, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Globe, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import type { ViewerLoginHistoryEntry as EntryType } from "@/lib/tenant-profile.service";

interface Props {
  entries: EntryType[];
  total: number;
  page: number;
  size: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ViewerLoginHistory({ entries, total, page, size, isLoading, onPageChange }: Props) {
  const totalPages = Math.ceil(total / size);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Login History</h2>
        </div>
        <span className="text-xs text-slate-500">{total} total records</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No login history found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Device</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Browser</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-3">
                      {e.success ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-500/10">
                          <XCircle className="w-3 h-3 mr-1" /> Failed
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" /> {e.device}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                      {e.browser} / {e.os}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{e.city}, {e.country}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <PaginationControls
              currentPage={page}
              totalPages={Math.max(1, totalPages)}
              totalItems={total}
              pageSize={size}
              onPageChange={onPageChange}
              onPageSizeChange={() => {}}
              pageSizeOptions={[10]}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}
