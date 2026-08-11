import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SettingCardProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SettingCard({ title, description, icon: Icon, children, action, className, delay = 0.1 }: SettingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300",
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl ring-1 ring-slate-200/60 dark:ring-white/10 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:ring-emerald-200 dark:group-hover:ring-emerald-800 transition-colors duration-300">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-emerald-950 dark:group-hover:text-emerald-100 transition-colors duration-300">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
        <div>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
