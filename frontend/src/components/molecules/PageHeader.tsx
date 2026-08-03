import React from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm shrink-0"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-100/80 dark:bg-emerald-950/40 rounded-xl ring-1 ring-emerald-500/20 dark:ring-emerald-500/30">
          <Icon className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </motion.div>
  );
}
