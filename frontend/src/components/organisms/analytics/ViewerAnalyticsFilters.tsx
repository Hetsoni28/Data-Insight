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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 bg-slate-50/60 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800">
      {/* Date presets */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0">
          <Calendar className="w-3.5 h-3.5" />
          Period:
        </div>
        <div className="flex gap-1.5">
          {DATE_PRESETS.map((preset) => {
            const isActive = activePreset === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                disabled={isLoading}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 border",
                  isActive
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRefresh(activePreset)}
          disabled={isLoading}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white gap-1.5"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          {isLoading ? "Loading…" : "Refresh"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-1.5"
          disabled
        >
          <Filter className="w-3.5 h-3.5" />
          More Filters
        </Button>
      </div>
    </div>
  );
}
