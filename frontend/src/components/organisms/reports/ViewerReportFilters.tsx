"use client";

import { cn } from "@/lib/utils";
import type { ViewerReportFiltersResponse } from "@/lib/viewer.service";

interface ViewerReportFiltersProps {
  filters: ViewerReportFiltersResponse | null;
  activeCategory: string;
  activeStatus: string;
  activeDepartment: string;
  onChange: (key: string, value: string) => void;
}

export function ViewerReportFilters({
  filters,
  activeCategory,
  activeStatus,
  activeDepartment,
  onChange,
}: ViewerReportFiltersProps) {
  if (!filters) return null;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange("category", cat === "All" ? "" : cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
              (activeCategory === cat || (!activeCategory && cat === "All"))
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-400"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Secondary Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={activeDepartment}
            onChange={(e) => onChange("department", e.target.value)}
            className="appearance-none h-10 pl-4 pr-10 py-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
          >
            <option value="">All Departments</option>
            {filters.departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={activeStatus}
            onChange={(e) => onChange("status", e.target.value)}
            className="appearance-none h-10 pl-4 pr-10 py-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {filters.statuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
