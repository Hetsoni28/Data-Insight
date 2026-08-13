import React, { useState } from "react";
import { History, ShieldAlert, ShieldCheck, Globe, Monitor, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { PaginationControls } from "@/components/molecules/PaginationControls";

interface LoginHistoryItem {
  id: string;
  ip_address: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  city: string;
  success: boolean;
  failure_reason?: string;
  created_at: string;
}

interface Props {
  history: LoginHistoryItem[];
}

export function LoginHistoryTable({ history }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalItems = history.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedHistory = history.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card className="border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02] rounded-t-xl">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Login History</CardTitle>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
          Review your recent login attempts. If you see anything suspicious, change your password immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
            <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No login history found</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {paginatedHistory.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${item.success ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                      {item.success ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.success ? "Successful Login" : "Failed Login Attempt"}
                        </p>
                        {!item.success && item.failure_reason && (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800/50">
                            {item.failure_reason}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          {item.device?.toLowerCase().includes("mobile") || item.os?.toLowerCase().includes("ios") || item.os?.toLowerCase().includes("android") ? (
                            <Smartphone className="w-3.5 h-3.5 opacity-70" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 opacity-70" />
                          )}
                          {item.browser} on {item.os}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 opacity-70" />
                          {item.city}, {item.country} ({item.ip_address})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-4 text-right">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {format(new Date(item.created_at), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {format(new Date(item.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[5, 10, 25]}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
