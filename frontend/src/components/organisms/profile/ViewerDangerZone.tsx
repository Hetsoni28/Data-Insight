"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, LogOut, Trash2, Loader2, Download, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ViewerProfileService } from "@/lib/viewer-profile.service";
import { useAuthStore } from "@/store/authStore";

interface Props {
  isLoading: boolean;
}

export function ViewerDangerZone({ isLoading }: Props) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { logout } = useAuthStore();

  if (isLoading) {
    return (
      <div className="border border-rose-200 dark:border-rose-900/50 rounded-xl p-6">
        <Skeleton className="h-6 w-48" />
      </div>
    );
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await ViewerProfileService.requestDataExport();
      toast.success(res.message);
    } catch { toast.error("Failed to request export."); }
    finally { setExporting(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await ViewerProfileService.requestAccountDeletion();
      toast.success(res.message);
      setConfirmDelete(false);
    } catch { toast.error("Failed to request deletion."); }
    finally { setDeleting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      {/* Data Export */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Personal Data & Privacy</h2>
        <p className="text-sm text-slate-500 mb-4">Request a copy of your personal data or manage your privacy settings.</p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {exporting ? "Requesting..." : "Export Personal Data"}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-rose-200 dark:border-rose-900/50 rounded-xl p-6 bg-rose-50/30 dark:bg-rose-950/10">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-400">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          {/* Logout All */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-rose-100 dark:border-rose-900/30 bg-white dark:bg-slate-900">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Logout All Devices</p>
              <p className="text-xs text-slate-500">Sign out from all sessions including this one.</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="text-rose-600 border-rose-200 hover:bg-rose-50">
              <LogOut className="w-3.5 h-3.5 mr-2" /> Logout All
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-rose-100 dark:border-rose-900/30 bg-white dark:bg-slate-900">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Request Account Deletion</p>
              <p className="text-xs text-slate-500">Submit a request to your organization admin to delete your account.</p>
            </div>
            {confirmDelete ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-rose-600 hover:bg-rose-700 text-white">
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Account
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
