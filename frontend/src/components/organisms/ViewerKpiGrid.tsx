"use client";

import { motion } from "framer-motion";
import {
  FileText, LayoutDashboard, Database, Eye, Download, Bookmark,
  Bell, Brain, TrendingUp, ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerKpis } from "@/lib/viewer.service";

interface ViewerKpiGridProps {
  kpis: ViewerKpis | undefined;
  isLoading: boolean;
}

const buildKpiCards = (kpis: ViewerKpis) => [
  {
    title: "Reports Shared",
    value: kpis.reports_shared,
    subtext: "Available to review",
    icon: <FileText className="w-5 h-5" />,
    color: "emerald",
    href: "#reports",
  },
  {
    title: "Dashboards",
    value: kpis.dashboards_available,
    subtext: "Interactive views",
    icon: <LayoutDashboard className="w-5 h-5" />,
    color: "teal",
    href: "#dashboards",
  },
  {
    title: "Datasets",
    value: kpis.datasets_available,
    subtext: "Shared with you",
    icon: <Database className="w-5 h-5" />,
    color: "cyan",
    href: "#datasets",
  },
  {
    title: "Viewed Today",
    value: kpis.reports_viewed_today,
    subtext: "Reports opened",
    icon: <Eye className="w-5 h-5" />,
    color: "indigo",
    href: "#activity",
  },
  {
    title: "Downloads",
    value: kpis.downloads_count,
    subtext: "Total all time",
    icon: <Download className="w-5 h-5" />,
    color: "violet",
    href: "#reports",
  },
  {
    title: "Bookmarks",
    value: kpis.bookmarks_count,
    subtext: "Saved reports",
    icon: <Bookmark className="w-5 h-5" />,
    color: "amber",
    href: "#reports",
  },
  {
    title: "Unread Alerts",
    value: kpis.unread_notifications,
    subtext: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    color: "rose",
    href: "#notifications",
  },
  {
    title: "AI Chats",
    value: kpis.recent_ai_conversations,
    subtext: "Conversations total",
    icon: <Brain className="w-5 h-5" />,
    color: "purple",
    href: "#ai-assistant",
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30", icon: "text-emerald-600 dark:text-emerald-400", glow: "bg-emerald-500/10" },
  teal:    { bg: "bg-teal-50 dark:bg-teal-500/10",       border: "border-teal-200 dark:border-teal-500/30",       icon: "text-teal-600 dark:text-teal-400",       glow: "bg-teal-500/10" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-500/10",        border: "border-cyan-200 dark:border-cyan-500/30",        icon: "text-cyan-600 dark:text-cyan-400",        glow: "bg-cyan-500/10" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",    border: "border-indigo-200 dark:border-indigo-500/30",    icon: "text-indigo-600 dark:text-indigo-400",    glow: "bg-indigo-500/10" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-500/10",    border: "border-violet-200 dark:border-violet-500/30",    icon: "text-violet-600 dark:text-violet-400",    glow: "bg-violet-500/10" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",      border: "border-amber-200 dark:border-amber-500/30",      icon: "text-amber-600 dark:text-amber-400",      glow: "bg-amber-500/10" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-500/10",        border: "border-rose-200 dark:border-rose-500/30",        icon: "text-rose-600 dark:text-rose-400",        glow: "bg-rose-500/10" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-500/10",    border: "border-purple-200 dark:border-purple-500/30",    icon: "text-purple-600 dark:text-purple-400",    glow: "bg-purple-500/10" },
};

export function ViewerKpiGrid({ kpis, isLoading }: ViewerKpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const cards = buildKpiCards(kpis);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card, idx) => {
        const c = colorMap[card.color];
        return (
          <motion.a
            key={card.title}
            href={card.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            className="relative overflow-hidden bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-4 shadow-sm cursor-pointer block no-underline group transition-all"
          >
            {/* Glow on hover */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 ${c.glow} rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-1.5 rounded-lg ${c.bg} border ${c.border}`}>
                  <span className={c.icon}>{card.icon}</span>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.04, type: "spring" }}
                className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5"
              >
                {card.value.toLocaleString()}
              </motion.div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                {card.title}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {card.subtext}
              </div>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
