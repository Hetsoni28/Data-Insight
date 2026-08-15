"use client";

import { Download, BookmarkPlus, Sparkles, MoreHorizontal, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { toast } from "sonner";
import { useState } from "react";

interface ViewerAnalyticsHeaderProps {
  domain: string;
  lastRefresh?: string;
  onOpenAi: () => void;
  onSaveView: () => void;
  isSaving: boolean;
}

export function ViewerAnalyticsHeader({ domain, lastRefresh, onOpenAi, onSaveView, isSaving }: ViewerAnalyticsHeaderProps) {
  const { activeWs } = useWorkspaceStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Trigger browser print dialog which allows Save as PDF
      window.print();
      toast.success("Print / Save as PDF dialog opened.");
    } catch {
      toast.error("Could not open export dialog.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/viewer/dashboard">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white -ml-2">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </Button>
          </Link>
          <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            {activeWs?.name || "Workspace"}
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
            {domain} Analytics
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Intelligence Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Analytics for <span className="font-medium text-slate-700 dark:text-slate-300">{activeWs?.name || "your workspace"}</span>.
          {lastRefresh && <span className="ml-1">Last synced: {lastRefresh}</span>}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="hidden md:flex bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-1.5"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSaveView}
          disabled={isSaving}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 gap-1.5"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
          {isSaving ? "Saving…" : "Save View"}
        </Button>

        <Button
          size="sm"
          onClick={onOpenAi}
          className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md shadow-emerald-500/20 gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Ask AI
        </Button>

        <Button variant="ghost" size="icon" className="md:hidden">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
