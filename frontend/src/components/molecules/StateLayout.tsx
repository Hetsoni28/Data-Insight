"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StateLayoutProps {
  illustration: ReactNode;
  headline: string;
  description: string;
  primaryAction?: { label: string; onClick: () => void; icon?: ReactNode; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void; icon?: ReactNode; disabled?: boolean };
  aiSuggestion?: string;
  keyboardShortcut?: string;
}

export const StateLayout: React.FC<StateLayoutProps> = ({
  illustration,
  headline,
  description,
  primaryAction,
  secondaryAction,
  aiSuggestion,
  keyboardShortcut,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 text-center bg-transparent relative overflow-hidden rounded-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 relative z-10 w-full max-w-sm mx-auto flex items-center justify-center"
      >
        {illustration}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        className="relative z-10 space-y-3 max-w-lg mx-auto"
      >
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {headline}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto">
          {description}
        </p>

        {(primaryAction || secondaryAction) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6"
          >
            {secondaryAction && (
              <Button
                variant="outline"
                size="default"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="w-full sm:w-auto h-10 px-5 bg-transparent border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl transition-all shadow-sm"
              >
                {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
                {secondaryAction.label}
              </Button>
            )}
            
            {primaryAction && (
              <Button
                variant="default"
                size="default"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_2px_10px_rgba(5,150,105,0.2)] hover:shadow-[0_4px_15px_rgba(5,150,105,0.3)] transition-all font-medium"
              >
                {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
                {primaryAction.label}
              </Button>
            )}
          </motion.div>
        )}

        {(aiSuggestion || keyboardShortcut) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="pt-6 flex flex-col items-center gap-2"
          >
            {aiSuggestion && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Suggestion: {aiSuggestion}
              </div>
            )}
            {keyboardShortcut && (
              <div className="text-xs text-slate-400 flex items-center gap-1">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-mono text-slate-500">{keyboardShortcut}</kbd> to focus
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
