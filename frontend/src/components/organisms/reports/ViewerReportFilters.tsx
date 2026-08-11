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
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm"
                : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-400"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Secondary Filters */}
      <div className="flex items-center gap-3">
        <select
          value={activeDepartment}
          onChange={(e) => onChange("department", e.target.value)}
          className="h-9 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Departments</option>
          {filters.departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          value={activeStatus}
          onChange={(e) => onChange("status", e.target.value)}
          className="h-9 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          {filters.statuses.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
