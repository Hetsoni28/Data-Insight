"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, FileText, LayoutDashboard, Database, Brain, Shield, Info, CheckCircle2, X, Loader2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/molecules/PaginationControls";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">You&apos;re all caught up!</p>
            <p className="text-slate-400 text-xs mt-1">No unread notifications at the moment.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence initial={false}>
                {notifications
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item, idx) => {
                    const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES["Low"];
                    const icon = CATEGORY_ICON[item.category] || CATEGORY_ICON["System"];
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative flex gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all"
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border", style)}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(item.created_at)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span>{item.category}</span>
                            {!item.is_read && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <span className="text-emerald-500">New</span>
                              </>
                            )}
                          </div>
                        </div>

                        {!item.is_read && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => markAsRead(item.id)}
                              disabled={markingId === item.id}
                              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all shadow-sm"
                              title="Mark as read"
                            >
                              {markingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                        {!item.is_read && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 group-hover:opacity-0 transition-opacity" />
                        )}
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
            {Math.ceil(notifications.length / pageSize) > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-white/5">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={Math.ceil(notifications.length / pageSize)}
                  totalItems={notifications.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
