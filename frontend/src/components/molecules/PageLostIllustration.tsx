"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const PageLostIllustration: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      id: i,
      left: `${20 + Math.random() * 60}%`,
      top: `${20 + Math.random() * 60}%`,
      yAnim: [0, -20 - Math.random() * 20] as [number, number],
      rotate: (Math.random() - 0.5) * 45,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    })),
    []
  );

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-slate-50 dark:bg-white/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating 404 Sign / Map */}
      <motion.div
        className="relative z-10 w-24 h-24 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden"
        initial={{ y: 0, rotate: -5 }}
        animate={{ y: [-5, 5, -5], rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-4xl font-black text-slate-200 dark:text-slate-700 dark:text-slate-300 select-none">404</span>
        {/* Tear Line */}
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-slate-300 dark:border-slate-600 rotate-12" />
      </motion.div>

      {/* Floating Magnifying Glass */}
      <motion.div
        className="absolute z-20 top-1/4 right-10"
        initial={{ y: 0, rotate: 0 }}
        animate={{ y: [-10, 10, -10], rotate: [0, 45, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-10 h-10 rounded-full border-4 border-emerald-400 bg-emerald-500/10 backdrop-blur-sm relative shadow-lg">
          <div className="absolute top-full left-1/2 w-2 h-8 bg-slate-400 rounded-b-full -translate-x-1/2" />
        </div>
      </motion.div>
      
      {/* Question Marks */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-slate-400/50 font-black text-xl"
          style={{ left: p.left, top: p.top }}
          animate={{ y: p.yAnim, opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: p.rotate }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
        >
          ?
        </motion.div>
      ))}
    </div>
  );
};
