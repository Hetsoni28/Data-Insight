"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const AiCopilotIllustration: React.FC = () => {
  const bars = useMemo(() =>
    Array.from({ length: 15 }, () => ({
      heightEnd: 10 + Math.random() * 30,
      duration: 0.5 + Math.random(),
    })),
    []
  );

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* AI Robot Core */}
      <motion.div
        className="relative z-10 w-24 h-24 bg-white dark:bg-white/10 rounded-[2rem] shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden"
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-50" />
        {/* Eyes / Visor */}
        <div className="w-16 h-8 bg-slate-900 dark:bg-black/60 rounded-full flex items-center justify-center gap-2 px-3 overflow-hidden border border-slate-700 dark:border-white/10">
          <motion.div
            className="w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
            animate={{ scaleY: [1, 0.1, 1, 1, 1, 1], x: [0, 2, -2, 0, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 1] }}
          />
          <motion.div
            className="w-3 h-3 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
            animate={{ scaleY: [1, 0.1, 1, 1, 1, 1], x: [0, 2, -2, 0, 0, 0] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 1] }}
          />
        </div>
      </motion.div>

      {/* Typing Bubble */}
      <motion.div
        className="absolute z-20 top-6 -right-6 bg-white dark:bg-white/10 rounded-2xl rounded-bl-none shadow-lg border border-slate-200/60 dark:border-white/10 px-4 py-3 flex items-center gap-1.5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div className="w-2 h-2 bg-purple-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
        <motion.div className="w-2 h-2 bg-purple-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
        <motion.div className="w-2 h-2 bg-purple-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
      </motion.div>

      {/* Waveform Bottom */}
      <div className="absolute bottom-6 flex items-end justify-center gap-1 w-full h-10">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-purple-500/40 dark:bg-purple-500/30 rounded-t-full"
            animate={{ height: [10, bar.heightEnd, 10] }}
            transition={{ duration: bar.duration, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
};
