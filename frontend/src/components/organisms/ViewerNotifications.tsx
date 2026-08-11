"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, FileText, LayoutDashboard, Database, Brain, Shield, Info, CheckCircle2, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  icon: string | null;
  created_at: string;
  is_read?: boolean;
}

interface ViewerNotificationsProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400",
  High:     "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
  Medium:   "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400",
  Low:      "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400",
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "AI":           <Brain className="w-4 h-4" />,
  "Security":     <Shield className="w-4 h-4" />,
  "Organization": <LayoutDashboard className="w-4 h-4" />,
  "Billing":      <FileText className="w-4 h-4" />,
  "System":       <Info className="w-4 h-4" />,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function ViewerNotifications({ notifications, isLoading, onRefresh }: ViewerNotificationsProps) {
  const [markingId, setMarkingId] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      toast.success("Marked as read");
      onRefresh();
    } catch {
      toast.error("Could not mark notification as read.");
    } finally {
      setMarkingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" id="notifications">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            Notifications
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onRefresh}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">You're all caught up!</p>
            <p className="text-slate-400 text-xs mt-1">No unread notifications at the moment.</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {notifications.map((n, idx) => {
                const priorityStyle = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.Low;
                const categoryIcon = CATEGORY_ICON[n.category] || <Info className="w-4 h-4" />;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border", priorityStyle)}>
                      {categoryIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                    <button
                      onClick={() => markAsRead(n.id)}
                      disabled={markingId === n.id}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-40"
                      title="Mark as read"
                    >
                      {markingId === n.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
