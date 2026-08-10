import React, { useState } from "react";
import { History, ShieldAlert, ShieldCheck } from "lucide-react";
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
    <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-xl">Login History</CardTitle>
        </div>
        <CardDescription>
          Review your recent login attempts. If you see anything suspicious, change your password immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6 border rounded-xl border-dashed">No login history found.</p>
        ) : (
          <>
            <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date & Time</th>
                    <th className="px-4 py-3 font-medium">Device & Browser</th>
                    <th className="px-4 py-3 font-medium">IP Address</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {paginatedHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        {item.success ? (
                          <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="w-4 h-4 mr-1.5" /> Success
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 dark:text-red-400 font-medium" title={item.failure_reason}>
                            <ShieldAlert className="w-4 h-4 mr-1.5" /> Failed
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {format(new Date(item.created_at), "MMM d, yyyy HH:mm:ss")}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {item.browser} on {item.os}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {item.ip_address}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {item.city}, {item.country}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </CardContent>
    </Card>
  );
}
