"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const AnalyticsComingSoonIllustration: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      id: i,
      left: `${30 + Math.random() * 40}%`,
      top: `${30 + Math.random() * 40}%`,
      yAnim: [0, -30 - Math.random() * 20] as [number, number],
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 2,
      value: Math.floor(Math.random() * 100),
    })),
    []
  );

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Chart Card */}
      <motion.div
        className="relative z-10 w-32 h-24 bg-white dark:bg-white/10 rounded-2xl shadow-xl border border-slate-200/60 dark:border-white/10 p-3 overflow-hidden flex flex-col justify-end"
        initial={{ y: 0 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute top-3 left-3 flex gap-1">
          <div className="w-8 h-2 bg-slate-200 dark:bg-white/10 rounded-full" />
        </div>
        <svg className="w-full h-12" viewBox="0 0 100 40" preserveAspectRatio="none">
          <motion.path
            d="M 0 40 L 20 30 L 40 35 L 60 15 L 80 20 L 100 5"
            fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-orange-500"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.path
            d="M 0 40 L 20 30 L 40 35 L 60 15 L 80 20 L 100 5 L 100 50 L 0 50 Z"
            fill="currentColor" className="text-orange-500/10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
          />
        </svg>
      </motion.div>

      {/* Floating KPI Cards */}
      <motion.div
        className="absolute z-20 top-4 right-2 w-16 h-12 bg-white dark:bg-white/10 rounded-xl shadow-lg border border-slate-200/60 dark:border-white/10 p-2 flex flex-col items-center justify-center"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, y: [-2, 2, -2] }}
        transition={{ opacity: { duration: 0.5 }, x: { duration: 0.5 }, y: { duration: 3, repeat: Infinity, delay: 0.5 } }}
      >
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">+42%</span>
        <span className="text-[8px] text-emerald-500 font-medium">Growth</span>
      </motion.div>

      <motion.div
        className="absolute z-0 bottom-6 left-2 w-14 h-12 bg-white dark:bg-white/10 rounded-xl shadow-md border border-slate-200/60 dark:border-white/10 p-2 flex flex-col items-center justify-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0, y: [2, -2, 2] }}
        transition={{ opacity: { duration: 0.5, delay: 0.2 }, x: { duration: 0.5, delay: 0.2 }, y: { duration: 3.5, repeat: Infinity, delay: 0.2 } }}
      >
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">8.4k</span>
        <span className="text-[8px] text-emerald-500 font-medium">Views</span>
      </motion.div>

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-orange-400/50 font-mono text-xs font-bold"
          style={{ left: p.left, top: p.top }}
          animate={{ y: p.yAnim, opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        >
          {p.value}
        </motion.div>
      ))}
    </div>
  );
};
