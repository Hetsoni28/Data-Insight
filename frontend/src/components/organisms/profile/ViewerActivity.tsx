"use client";

import { motion } from "framer-motion";
import { Activity, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerActivityEntry } from "@/lib/tenant-profile.service";

import { PaginationControls } from "@/components/molecules/PaginationControls";

interface Props {
  entries: ViewerActivityEntry[];
  total: number;
  page: number;
  size: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ViewerActivity({ entries, total, page, size, isLoading, onPageChange }: Props) {
  const totalPages = Math.ceil(total / size);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No recent activity found.</p>
      ) : (
        <>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
            {entries.map((entry) => (
              <div key={entry.id} className="relative flex items-center gap-4 pl-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500 shadow z-10 shrink-0" />
                <div className="w-full p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                    <span className="font-medium text-sm text-slate-900 dark:text-white capitalize">{entry.action.replace(/\./g, " ")}</span>
                    <span className="text-xs text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500">Resource: {entry.resource_type || "Account"} {entry.resource_id ? `(${entry.resource_id.substring(0, 8)}...)` : ""}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
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
