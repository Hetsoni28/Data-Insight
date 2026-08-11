"use client";

import { motion } from "framer-motion";
import { Download, BookmarkPlus, Sparkles, Filter, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface ViewerAnalyticsHeaderProps {
  domain: string;
  lastRefresh?: string;
  onOpenAi: () => void;
  onSaveView: () => void;
  isSaving: boolean;
}

export function ViewerAnalyticsHeader({ domain, lastRefresh, onOpenAi, onSaveView, isSaving }: ViewerAnalyticsHeaderProps) {
  const { activeWs } = useWorkspaceStore();
  const userName = "Viewer"; // Or fetch from profile
  
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
          <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">
            {domain} Analytics
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          Intelligence Center
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalized business analytics for {userName}. {lastRefresh && `Last synchronized: ${lastRefresh}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden md:flex bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSaveView} 
          disabled={isSaving}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        >
          <BookmarkPlus className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save View"}
        </Button>
        <Button 
          size="sm" 
          onClick={onOpenAi}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md shadow-indigo-500/20"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Ask AI
        </Button>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
