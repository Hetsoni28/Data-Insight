import React, { useState } from "react";
import { Monitor, Smartphone, Globe, Shield, RefreshCw, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileService, UserSession } from "@/lib/profile.service";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/molecules/PaginationControls";

interface Props {
  sessions: UserSession[];
  onUpdate: () => void;
}

export function ActiveSessionsCard({ sessions, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalItems = sessions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedSessions = sessions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRevoke = async (id: string) => {
    setLoading(id);
    try {
      await ProfileService.terminateSession(id);
      toast.success("Session terminated.");
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to terminate session.");
    } finally {
      setLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    setLoading("all");
    try {
      await ProfileService.terminateAllOtherSessions();
      toast.success("All other sessions terminated.");
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to terminate sessions.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02] rounded-t-xl">
        <div>
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            Active Sessions
          </CardTitle>
          <CardDescription className="mt-1 text-slate-500 dark:text-slate-400">
            Review and revoke your active sessions across all devices.
          </CardDescription>
        </div>
        {sessions.length > 1 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRevokeAll} 
            disabled={loading === "all"} 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors shadow-sm"
          >
            {loading === "all" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            Log Out All Other Devices
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Monitor className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No active sessions found.</p>
            </div>
          ) : (
            paginatedSessions.map((session) => (
              <div key={session.id} className="group flex items-start justify-between p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/50 shadow-sm hover:border-emerald-500/30 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100/80 dark:bg-slate-700/50 rounded-xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                    {session.device_name?.toLowerCase().includes("mobile") || session.device_name?.toLowerCase().includes("ios") || session.device_name?.toLowerCase().includes("android") ? (
                      <Smartphone className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    ) : (
                      <Monitor className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                      </p>
                      {session.is_current && (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 border-none shadow-none font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                          Current Session
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 opacity-70" />
                        {session.ip_address || "Unknown IP"}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{session.location || "Unknown Location"}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${session.is_current ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${session.is_current ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        </span>
                        Active {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRevoke(session.id)}
                    disabled={loading === session.id}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  >
                    {loading === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        {totalItems > 0 && (
          <div className="mt-6 border-t border-slate-100 dark:border-white/5 pt-4">
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
        )}
      </CardContent>
    </Card>
  );
}
