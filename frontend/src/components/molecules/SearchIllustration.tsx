"use client";

import React from "react";
import { motion } from "framer-motion";

export const SearchIllustration: React.FC = () => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Documents */}
      <div className="relative z-10 w-32 h-32 mt-4">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-md border border-slate-200/60 dark:border-white/10 p-3"
            initial={{ rotate: (i - 1) * 10, y: i * 5, opacity: 1 - i * 0.2 }}
            animate={{ 
              rotate: [(i - 1) * 10, (i - 1) * 15, (i - 1) * 10], 
              y: [i * 5, i * 5 - 5, i * 5] 
            }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
            style={{ zIndex: 3 - i }}
          >
            {/* Document lines */}
            <div className="w-1/2 h-2 bg-slate-200 dark:bg-white/20 rounded-full mb-2" />
            <div className="w-3/4 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mb-1" />
            <div className="w-2/3 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mb-1" />
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full" />
          </motion.div>
        ))}

        {/* Scanning Laser */}
        <motion.div
          className="absolute z-20 left-[-10px] right-[-10px] h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Magnifying Glass Reticle */}
      <motion.div
        className="absolute z-30 w-16 h-16 rounded-full border-2 border-blue-400 bg-blue-500/10 backdrop-blur-[2px] pointer-events-none"
        animate={{
          x: [-20, 20, -10, 15, -20],
          y: [-20, -10, 20, 5, -20],
          scale: [1, 1.1, 1, 1.05, 1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute top-1/2 left-1/2 w-2 h-2 border border-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-blue-400/50 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-blue-400/50 -translate-y-1/2" />
      </motion.div>
    </div>
  );
};
