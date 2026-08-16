"use client";

import { useState } from "react";
import { Calendar, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "YTD", value: "ytd" },
];

interface ViewerAnalyticsFiltersProps {
  onRefresh: (dateRange?: string) => void;
  isLoading: boolean;
}

export function ViewerAnalyticsFilters({ onRefresh, isLoading }: ViewerAnalyticsFiltersProps) {
  const [activePreset, setActivePreset] = useState("quarter");

  const handlePresetClick = (value: string) => {
    setActivePreset(value);
    onRefresh(value);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm mb-6">
      {/* Date presets */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap shrink-0">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Period:
        </div>
        <div className="flex gap-2">
          {DATE_PRESETS.map((preset) => {
            const isActive = activePreset === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                disabled={isLoading}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border",
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 hover:bg-emerald-500 hover:-translate-y-0.5"
                    : "bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-500/30 hover:shadow-sm"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200/80 dark:border-white/10 pt-3 sm:pt-0 sm:pl-5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRefresh(activePreset)}
          disabled={isLoading}
          className="text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 gap-2 font-semibold transition-all h-9 px-3 rounded-lg"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          {isLoading ? "Loading…" : "Refresh"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/80 dark:border-white/10 gap-2 font-semibold h-9 px-4 rounded-lg shadow-sm"
          disabled
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>
    </div>
  );
}
