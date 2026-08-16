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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4, scale: 1.02 } : {}}
      onClick={onClick}
      className={`relative overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group ${onClick ? 'cursor-pointer hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900/80' : ''}`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
        {icon}
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center shadow-inner group-hover:shadow-md transition-shadow">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{title}</p>
        {subtitle && <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
