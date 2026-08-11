"use client";

import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface ViewerReportHeaderProps {
  workspaceName?: string;
  search: string;
  setSearch: (val: string) => void;
  isLoading: boolean;
}

export function ViewerReportHeader({ workspaceName, search, setSearch, isLoading }: ViewerReportHeaderProps) {
  const { data: user } = useAuth();
  
  const today = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6 mb-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
          <span>{user?.tenant_id ? "Enterprise Intelligence" : "Intelligence"}</span>
          <span>&bull;</span>
          <span>{workspaceName || "Workspace"}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports Center</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Viewer Role</span>
          <span>&bull;</span>
          <span>{user?.full_name || user?.email}</span>
          <span>&bull;</span>
          <span>{today}</span>
        </div>
      </div>

      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search enterprise reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 w-full rounded-full border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          </div>
        )}
      </div>
    </div>
  );
}
