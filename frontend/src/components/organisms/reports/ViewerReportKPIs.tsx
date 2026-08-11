"use client";

import { motion } from "framer-motion";
import { FileText, Bookmark, Clock, Eye, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViewerKpis } from "@/lib/viewer.service";

interface ViewerReportKPIsProps {
  kpis?: ViewerKpis;
  isLoading: boolean;
  onFilterChange: (key: string, value: any) => void;
}

export function ViewerReportKPIs({ kpis, isLoading, onFilterChange }: ViewerReportKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <KpiCard
        title="Reports Available"
        value={kpis?.reports_shared ?? 0}
        icon={<FileText className="w-5 h-5 text-blue-500" />}
        onClick={() => {
          onFilterChange("status", "");
          onFilterChange("is_bookmarked", undefined);
        }}
      />
      <KpiCard
        title="Recently Viewed"
        value={kpis?.reports_viewed_today ?? 0}
        icon={<Eye className="w-5 h-5 text-emerald-500" />}
        subtitle="Today"
      />
      <KpiCard
        title="Bookmarked"
        value={kpis?.bookmarks_count ?? 0}
        icon={<Bookmark className="w-5 h-5 text-amber-500" />}
        onClick={() => onFilterChange("is_bookmarked", true)}
      />
      <KpiCard
        title="AI Insights"
        value={kpis?.datasets_available ?? 0}
        icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        subtitle="Available to analyze"
      />
    </div>
  );
}

function KpiCard({ title, value, icon, subtitle, onClick }: { title: string; value: number; icon: React.ReactNode; subtitle?: string; onClick?: () => void; }) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : {}}
      onClick={onClick}
      className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
