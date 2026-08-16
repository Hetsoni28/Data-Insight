"use client";

import { Download, BookmarkPlus, Sparkles, MoreHorizontal, ArrowLeft, Loader2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

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
      window.print();
      toast.success("Print / Save as PDF dialog opened.");
    } catch {
      toast.error("Could not open export dialog.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 md:p-10 mb-6 shadow-2xl border border-white/10"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-20 -mr-16 text-white/5 blur-sm pointer-events-none">
        <BarChart2 className="w-96 h-96 transform rotate-6" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link href="/viewer/dashboard">
              <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-emerald-50 backdrop-blur-md border border-white/20 shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <Badge variant="outline" className="text-xs bg-white/10 text-emerald-100 border-white/20 backdrop-blur-md px-3 py-1 font-semibold tracking-wide shadow-sm">
              {activeWs?.name || "Workspace"}
            </Badge>
            <Badge className="text-xs bg-emerald-500/30 text-emerald-50 border border-emerald-400/30 backdrop-blur-md px-3 py-1 font-semibold tracking-wide shadow-sm">
              {domain} Analytics
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg"
          >
            Intelligence Center
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-emerald-100/80 font-medium max-w-xl text-base"
          >
            Performance and trends for <span className="text-white font-bold">{activeWs?.name || "your workspace"}</span>.
            {lastRefresh && <span className="ml-2 pl-2 border-l border-white/20">Synced: {lastRefresh}</span>}
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="hidden md:flex bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md shadow-sm h-11 px-5 rounded-xl font-semibold transition-all"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Export PDF
          </Button>

          <Button
            variant="outline"
            onClick={onSaveView}
            disabled={isSaving}
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md shadow-sm h-11 px-5 rounded-xl font-semibold transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving…" : "Save View"}
          </Button>

          <Button
            onClick={onOpenAi}
            className="bg-emerald-500 hover:bg-emerald-400 text-white border-0 shadow-lg shadow-emerald-500/30 h-11 px-6 rounded-xl font-bold transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ask AI
          </Button>

          <Button variant="ghost" size="icon" className="md:hidden bg-white/10 text-white border border-white/20 rounded-xl h-11 w-11">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
