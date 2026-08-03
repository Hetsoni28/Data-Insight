"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const ServerErrorIllustration: React.FC = () => {
  const sparks = useMemo(() => [
    { id: 1, x: [0, Math.random() * 20 - 10] as [number, number], y: [0, -10 - Math.random() * 20] as [number, number], duration: 0.5, delay: 0.2 },
    { id: 2, x: [0, Math.random() * 20 - 10] as [number, number], y: [0, -10 - Math.random() * 20] as [number, number], duration: 0.6, delay: 0.5 },
  ], []);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Server Stack */}
      <div className="relative z-10 flex flex-col gap-2">
        {/* Server 1 (Online) */}
        <div className="w-32 h-8 bg-white dark:bg-white/10 rounded-lg shadow-lg border border-slate-200/60 dark:border-white/10 flex items-center px-3 gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <div className="flex-1 flex gap-1">
            <div className="w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full" />
            <div className="w-1/2 h-1 bg-slate-100 dark:bg-white/10 rounded-full" />
          </div>
        </div>

        {/* Server 2 (Offline/Error) */}
        <motion.div
          className="w-32 h-8 bg-red-50 dark:bg-red-950/20 rounded-lg shadow-lg border border-red-200 dark:border-red-900/50 flex items-center px-3 gap-2"
          animate={{ x: [-2, 2, -2, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <motion.div 
            className="w-2 h-2 bg-red-500 rounded-full" 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <div className="flex-1 flex gap-1">
            <div className="w-full h-1 bg-red-200 dark:bg-red-900/50 rounded-full" />
            <div className="w-1/2 h-1 bg-red-200 dark:bg-red-900/50 rounded-full" />
          </div>
        </motion.div>

        {/* Server 3 (Online) */}
        <div className="w-32 h-8 bg-white dark:bg-white/10 rounded-lg shadow-lg border border-slate-200/60 dark:border-white/10 flex items-center px-3 gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <div className="flex-1 flex gap-1">
            <div className="w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full" />
            <div className="w-1/2 h-1 bg-slate-100 dark:bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Tiny Robot 1 */}
      <motion.div
        className="absolute z-20 w-6 h-6 bg-slate-800 dark:bg-white/20 rounded-md flex items-center justify-center border-2 border-slate-900 dark:border-white/10"
        initial={{ x: -40, y: 10 }}
        animate={{ 
          x: [-40, -20, -20, -40],
          y: [10, -5, -5, 10],
          rotate: [0, 15, 0, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div className="w-2 h-1 bg-blue-400 rounded-full" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
        {/* Robot arm */}
        <div className="absolute -right-3 w-3 h-1 bg-slate-600 rounded-full origin-left rotate-45" />
      </motion.div>

      {/* Sparks */}
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          style={{ left: '45%', top: '45%' }}
          animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
};
