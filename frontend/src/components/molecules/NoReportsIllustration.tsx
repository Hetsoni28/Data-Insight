"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const NoReportsIllustration: React.FC = () => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Center AI Core */}
      <motion.div
        className="relative z-10 w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden"
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-50" />
        <motion.div
          className="w-10 h-10 border-4 border-emerald-500 rounded-full"
          animate={{ scale: [1, 0.8, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-emerald-500 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Floating Chart Widget */}
      <motion.div
        className="absolute z-20 -right-4 top-8 w-20 h-24 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 flex items-end justify-between gap-1 overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, y: [-2, 2, -2] }}
        transition={{ 
          opacity: { duration: 0.5 },
          x: { duration: 0.5 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 } 
        }}
      >
        <motion.div className="w-full bg-emerald-500/40 rounded-t-sm origin-bottom" animate={{ height: ["20%", "60%", "20%"] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.div className="w-full bg-emerald-500/60 rounded-t-sm origin-bottom" animate={{ height: ["40%", "80%", "40%"] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <motion.div className="w-full bg-emerald-500 rounded-t-sm origin-bottom" animate={{ height: ["60%", "100%", "60%"] }} transition={{ duration: 3, repeat: Infinity }} />
      </motion.div>

      {/* Floating PDF Widget */}
      <motion.div
        className="absolute z-0 -left-6 bottom-10 w-16 h-20 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-2"
        initial={{ opacity: 0, x: -20, rotate: -10 }}
        animate={{ opacity: 1, x: 0, y: [2, -2, 2], rotate: [-10, -5, -10] }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.2 },
          x: { duration: 0.5, delay: 0.2 },
          y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-3/4 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </motion.div>
      
      {/* Particles */}
      {useMemo(() => [...Array(5)].map((_, i) => ({
        id: i,
        left: `${40 + Math.random() * 20}%`,
        top: `${40 + Math.random() * 20}%`,
        yAnim: [0, -40 - Math.random() * 40],
        xAnim: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 2
      })), []).map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: particle.yAnim,
            x: particle.xAnim,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
};
