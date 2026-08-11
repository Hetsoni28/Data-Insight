"use client";

import { motion } from "framer-motion";
import {
  Activity, FileText, LayoutDashboard, Download, Bookmark,
  Brain, Eye, ChevronRight, Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  status: string;
  created_at: string;
  extra_metadata: Record<string, any> | null;
}

interface ViewerActivityFeedProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

const ACTION_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  "report.view":        { icon: <Eye className="w-4 h-4" />,       label: "Viewed Report",        color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
  "report.download":    { icon: <Download className="w-4 h-4" />,    label: "Downloaded Report",    color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
  "report.bookmark":    { icon: <Bookmark className="w-4 h-4" />,    label: "Bookmarked Report",    color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
  "report.unbookmark":  { icon: <Bookmark className="w-4 h-4" />,    label: "Removed Bookmark",     color: "text-slate-400 bg-slate-50 dark:bg-white/5" },
  "ai.chat":            { icon: <Brain className="w-4 h-4" />,       label: "AI Conversation",      color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
  "dataset.view":       { icon: <Activity className="w-4 h-4" />,    label: "Viewed Dataset",       color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10" },
  "viewer.dashboard.view": { icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard Visit",  color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function ViewerActivityFeed({ activities, isLoading }: ViewerActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" id="activity">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your latest actions — newest first</p>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">No activity yet</p>
            <p className="text-slate-400 text-xs mt-1">Your activity will appear here as you explore reports and datasets.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {activities.map((item, idx) => {
              const meta = ACTION_META[item.action] || {
                icon: <Activity className="w-4 h-4" />,
                label: item.action.replace(/\./g, " "),
                color: "text-slate-400 bg-slate-50 dark:bg-white/5",
              };
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.color)}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{meta.label}</p>
                    {item.resource_type && (
                      <p className="text-xs text-slate-400 capitalize">{item.resource_type}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(item.created_at)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
