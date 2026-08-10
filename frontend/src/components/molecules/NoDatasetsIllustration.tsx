"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const NoDatasetsIllustration: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      top: `${10 + Math.random() * 80}%`,
      xAnim: [0, (128 - (30 + Math.random() * 60))],
      yAnim: [0, (128 - (30 + Math.random() * 60))],
      duration: 1.5 + Math.random(),
      delay: Math.random() * 2,
    })),
    []
  );

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background Pulse */}
      <motion.div
        className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Cloud Core */}
      <motion.div
        className="relative z-10 w-28 h-20 bg-white dark:bg-white/10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] border border-slate-200/60 dark:border-white/10 flex items-center justify-center overflow-hidden"
        initial={{ y: 0 }}
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-60" />
        
        {/* Cloud symbol details */}
        <div className="relative flex items-center justify-center">
          <motion.svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.path
              d="M14 26C8.47715 26 4 21.5228 4 16C4 10.4772 8.47715 6 14 6C15.1122 6 16.182 6.18182 17.1788 6.51351C19.1171 2.65997 23.1873 0 28 0C35.1797 0 41 5.8203 41 13C41 13.435 40.9786 13.865 40.937 14.2891C44.9388 15.228 48 18.847 48 23.1111C48 28.0204 44.0204 32 39.1111 32H14V26Z"
              fill="currentColor"
              className="text-emerald-500/20"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.path
              d="M14 26C8.47715 26 4 21.5228 4 16C4 10.4772 8.47715 6 14 6C15.1122 6 16.182 6.18182 17.1788 6.51351C19.1171 2.65997 23.1873 0 28 0C35.1797 0 41 5.8203 41 13C41 13.435 40.9786 13.865 40.937 14.2891C44.9388 15.228 48 18.847 48 23.1111C48 28.0204 44.0204 32 39.1111 32H14"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-emerald-500"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            />
          </motion.svg>
        </div>
      </motion.div>

      {/* Orbiting CSV File */}
      <motion.div
        className="absolute w-12 h-14 bg-white dark:bg-white/10 rounded-lg shadow-md border border-slate-200/60 dark:border-white/10 flex flex-col items-center justify-center p-1"
        style={{ originX: 4, originY: 2 }} // orbit radius
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <motion.div 
          className="w-full h-full flex items-center justify-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded"
          animate={{ rotate: -360 }} // Counter-rotate to stay upright
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        >
          CSV
        </motion.div>
      </motion.div>

      {/* Orbiting JSON File */}
      <motion.div
        className="absolute w-12 h-14 bg-white dark:bg-white/10 rounded-lg shadow-md border border-slate-200/60 dark:border-white/10 flex flex-col items-center justify-center p-1"
        style={{ originX: -3, originY: 3 }} // orbit radius
        initial={{ rotate: 120 }}
        animate={{ rotate: 480 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <motion.div 
          className="w-full h-full flex items-center justify-center text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/30 rounded"
          initial={{ rotate: -120 }}
          animate={{ rotate: -480 }} // Counter-rotate to stay upright
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          JSON
        </motion.div>
      </motion.div>

      {/* Orbiting Excel File */}
      <motion.div
        className="absolute w-12 h-14 bg-white dark:bg-white/10 rounded-lg shadow-md border border-slate-200/60 dark:border-white/10 flex flex-col items-center justify-center p-1"
        style={{ originX: 0, originY: -4 }} // orbit radius
        initial={{ rotate: 240 }}
        animate={{ rotate: 600 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <motion.div 
          className="w-full h-full flex items-center justify-center text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 rounded"
          initial={{ rotate: -240 }}
          animate={{ rotate: -600 }} // Counter-rotate to stay upright
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          XLSX
        </motion.div>
      </motion.div>

      {/* Inward flowing particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-emerald-400 rounded-full"
          style={{ left: p.left, top: p.top }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            x: p.xAnim,
            y: p.yAnim,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};
