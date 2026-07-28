"use client";

import React from "react";
import { motion } from "framer-motion";

export const SuccessIllustration: React.FC = () => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Core Ring */}
      <motion.div
        className="relative z-10 w-28 h-28 rounded-full border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="absolute inset-0 bg-emerald-500/10" />
        
        {/* Animated Checkmark */}
        <motion.svg
          className="w-12 h-12 text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M20 6L9 17L4 12"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </motion.svg>
      </motion.div>

      {/* Confetti Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-emerald-400 rounded-full"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            scale: [0, 1, 0],
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
};
