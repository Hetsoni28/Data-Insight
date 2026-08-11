import React, { useState } from "react";
import { Monitor, Smartphone, Globe, Shield, RefreshCw } from "lucide-react";
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
    <Card className="border-slate-200/60 dark:border-white/10 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-600" />
            Active Sessions
          </CardTitle>
          <CardDescription className="mt-1">
            Review and revoke your active sessions across all devices.
          </CardDescription>
        </div>
        {sessions.length > 1 && (
          <Button variant="outline" size="sm" onClick={handleRevokeAll} disabled={loading === "all"} className="text-red-600 hover:text-red-700">
            {loading === "all" ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
            Log Out All Other Devices
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No active sessions found.</p>
          ) : (
            paginatedSessions.map((session) => (
              <div key={session.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg">
                    {session.device_name?.toLowerCase().includes("mobile") || session.device_name?.toLowerCase().includes("ios") || session.device_name?.toLowerCase().includes("android") ? (
                      <Smartphone className="w-6 h-6 text-slate-500" />
                    ) : (
                      <Monitor className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {session.browser || "Unknown Browser"} on {session.os || "Unknown OS"}
                      </p>
                      {session.is_current && (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300">
                          Current Session
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {session.ip_address || "Unknown IP"}
                      </span>
                      <span>•</span>
                      <span>{session.location || "Unknown Location"}</span>
                      <span>•</span>
                      <span>Last active: {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRevoke(session.id)}
                    disabled={loading === session.id}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    {loading === session.id ? "Revoking..." : "Revoke"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        {totalItems > 0 && (
          <div className="mt-4">
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
