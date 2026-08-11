"use client";

import { Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ViewerAnalyticsFiltersProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function ViewerAnalyticsFilters({ onRefresh, isLoading }: ViewerAnalyticsFiltersProps) {
  // In a full implementation, these would be controlled by state and fetched from dataset dimensions
  const datePresets = ["Today", "Last 7 Days", "This Month", "This Quarter", "YTD"];
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 bg-slate-50/50 dark:bg-slate-900/20 px-4 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium whitespace-nowrap">
          <Calendar className="w-4 h-4" />
          Period:
        </div>
        <div className="flex gap-2">
          {datePresets.map((preset, i) => (
            <Badge 
              key={preset} 
              variant={i === 3 ? "default" : "outline"} 
              className={`cursor-pointer whitespace-nowrap ${i === 3 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white dark:bg-slate-900'}`}
            >
              {preset}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-3 sm:pt-0 sm:pl-4">
        <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900" disabled={isLoading}>
          <Filter className="w-3.5 h-3.5 mr-2" />
          More Filters
        </Button>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading} className="text-slate-500">
          <X className="w-3.5 h-3.5 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
