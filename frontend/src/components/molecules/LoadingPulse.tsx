"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingPulseProps {
  message?: string;
  messages?: string[];
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({ 
  message = "Loading...", 
  messages 
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);

  const displayMessage = messages ? messages[currentMessageIndex] : message;

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 text-center bg-transparent">
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        {/* Outer Orbit */}
        <motion.div
          className="absolute inset-0 border-2 border-slate-200 dark:border-white/10 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
        </motion.div>

        {/* Inner Orbit */}
        <motion.div
          className="absolute inset-4 border border-slate-200 dark:border-white/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute bottom-0 right-1/2 -mr-1.5 -mb-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
        </motion.div>

        {/* Center Pulse Core */}
        <motion.div
          className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-2xl shadow-inner border border-slate-200/60 dark:border-white/10 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ["25%", "50%", "25%"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-4 h-4 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      <div className="h-6 overflow-hidden relative w-full flex justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-slate-500 dark:text-slate-400 absolute"
          >
            {displayMessage}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
