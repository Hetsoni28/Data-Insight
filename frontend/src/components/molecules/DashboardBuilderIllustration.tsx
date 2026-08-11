"use client";

import React from "react";
import { motion } from "framer-motion";

export const DashboardBuilderIllustration: React.FC = () => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Canvas */}
      <div className="relative z-10 w-40 h-32 bg-white dark:bg-white/10 rounded-xl shadow-xl border border-slate-200/60 dark:border-white/10 p-2 grid grid-cols-3 grid-rows-3 gap-1 overflow-hidden">
        {/* Static blocks */}
        <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded col-span-2 row-span-1" />
        <div className="bg-slate-100 dark:bg-white/5 rounded col-span-1 row-span-2" />
        <div className="bg-slate-100 dark:bg-white/5 rounded col-span-1 row-span-1" />
        <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded col-span-1 row-span-1" />
        
        {/* The empty slot where a block will snap into */}
        <div className="col-span-2 row-span-1 bg-slate-50 dark:bg-white/5 border-2 border-dashed border-emerald-200 dark:border-emerald-500/30 rounded flex items-center justify-center relative">
          <div className="w-4 h-4 text-emerald-400 dark:text-emerald-400/60 flex items-center justify-center">+</div>
          
          {/* Snap outline effect */}
          <motion.div
            className="absolute inset-0 border-2 border-emerald-500 rounded"
            animate={{ opacity: [0, 0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.7] }}
          />
        </div>
      </div>

      {/* Floating Block to snap */}
      <motion.div
        className="absolute z-20 w-[6.5rem] h-9 bg-white dark:bg-white/15 rounded shadow-lg border border-emerald-400 dark:border-emerald-500 flex items-center justify-center cursor-move"
        initial={{ x: 60, y: 40, rotate: 10, scale: 1.1 }}
        animate={{ 
          x: [60, -18, -18, 60], 
          y: [40, 32, 32, 40],
          rotate: [10, 0, 0, 10],
          scale: [1.1, 1, 1, 1.1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-1/2 h-1.5 bg-indigo-200 dark:bg-indigo-800/50 rounded-full" />
      </motion.div>

      {/* Cursor */}
      <motion.div
        className="absolute z-30"
        initial={{ x: 75, y: 55 }}
        animate={{ 
          x: [75, -5, -5, 75], 
          y: [55, 45, 45, 55],
          scale: [1, 0.9, 0.9, 1] // "click" effect
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 00-.85.35z" fill="black" />
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.42c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 00-.85.35z" stroke="white" strokeWidth="1.5" />
        </svg>
      </motion.div>

    </div>
  );
};
