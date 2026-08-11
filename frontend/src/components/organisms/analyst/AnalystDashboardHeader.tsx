"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Database, Clock, RefreshCw, UploadCloud, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface AnalystDashboardHeaderProps {
  greetingName: string;
  workspaceName?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onUploadClick: () => void;
}

export function AnalystDashboardHeader({
  greetingName,
  workspaceName,
  isRefreshing,
  onRefresh,
  onUploadClick,
}: AnalystDashboardHeaderProps) {
  const lastUpdated = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all"
    >
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          {greetingName}
          <Sparkles className="w-6 h-6 text-emerald-500 animate-bounce" />
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 pt-1">
          <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Database className="w-4 h-4 text-emerald-500" />
            Workspace: <strong className="text-slate-900 dark:text-white font-semibold">{workspaceName || 'Loading...'}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2 h-11 px-5 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          Refresh Data
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onUploadClick}
            className="gap-2 h-11 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 border border-emerald-400/30 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Dataset
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
