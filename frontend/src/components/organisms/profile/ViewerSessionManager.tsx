"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Globe, Clock, Trash2, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import type { ViewerSession as SessionType } from "@/lib/viewer-profile.service";

interface Props {
  sessions: SessionType[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ViewerSessionManager({ sessions, isLoading, onRefresh }: Props) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await ViewerProfileService.revokeSession(id);
      toast.success("Session revoked.");
      onRefresh();
    } catch { toast.error("Failed to revoke session."); }
    finally { setRevoking(null); }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      await ViewerProfileService.revokeAllSessions();
      toast.success("All other sessions revoked.");
      onRefresh();
    } catch { toast.error("Failed to revoke sessions."); }
    finally { setRevokingAll(false); }
  };

  const getDeviceIcon = (device: string | null) => {
    if (device?.toLowerCase().includes("phone") || device?.toLowerCase().includes("android") || device?.toLowerCase().includes("iphone"))
      return Smartphone;
    return Monitor;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Sessions</h2>
        {sessions.length > 1 && (
          <Button variant="outline" size="sm" onClick={handleRevokeAll} disabled={revokingAll} className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20">
            {revokingAll ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <LogOut className="w-3.5 h-3.5 mr-2" />}
            Logout Others
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No active sessions found.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const DeviceIcon = getDeviceIcon(s.device_name);
            return (
              <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border ${s.is_current ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30"}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${s.is_current ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                    <DeviceIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {s.browser || "Unknown"} on {s.os || "Unknown"}
                      </p>
                      {s.is_current && <Badge className="text-[10px] bg-emerald-600 text-white">Current</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {s.location || "Unknown"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(s.last_active_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!s.is_current && (
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(s.id)} disabled={revoking === s.id} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                    {revoking === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
