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
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 shadow-sm shrink-0"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-100/80 rounded-xl ring-1 ring-emerald-500/20">
          <Icon className="h-6 w-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
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
