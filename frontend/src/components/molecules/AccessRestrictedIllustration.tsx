"use client";

import React from "react";
import { motion } from "framer-motion";

export const AccessRestrictedIllustration: React.FC = () => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vault Core */}
      <motion.div
        className="relative z-10 w-28 h-32 bg-white dark:bg-white/10 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden"
        initial={{ y: 0 }}
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-transparent opacity-50" />
        
        {/* Vault Door Detail */}
        <div className="absolute inset-2 border-2 border-slate-100 dark:border-white/10 rounded-xl pointer-events-none" />
        
        {/* Scanner Ring */}
        <div className="relative w-12 h-12 rounded-full border-4 border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-slate-50 dark:bg-white/5" />
          
          {/* Biometric Scan Line */}
          <motion.div
            className="absolute z-10 w-full h-0.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Fingerprint / Lock icon outline */}
          <svg className="w-5 h-5 text-slate-300 dark:text-slate-500 relative z-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </motion.div>

      {/* Security Nodes */}
      <motion.div
        className="absolute z-20 -right-2 top-10 w-10 h-10 bg-white dark:bg-white/10 rounded-lg shadow-md border border-slate-200/60 dark:border-white/10 p-2 flex items-center justify-center"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, y: [-2, 2, -2] }}
        transition={{ opacity: { duration: 0.5 }, x: { duration: 0.5 }, y: { duration: 3, repeat: Infinity, delay: 0.5 } }}
      >
        <motion.div className="w-2 h-2 bg-rose-500 rounded-full" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      </motion.div>
      
      <motion.div
        className="absolute z-0 bottom-8 -left-4 w-12 h-10 bg-white dark:bg-white/10 rounded-lg shadow-md border border-slate-200/60 dark:border-white/10 p-2 flex items-center justify-center gap-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0, y: [2, -2, 2] }}
        transition={{ opacity: { duration: 0.5 }, x: { duration: 0.5 }, y: { duration: 3.5, repeat: Infinity, delay: 0.2 } }}
      >
        <div className="w-1.5 h-1.5 bg-rose-500/50 rounded-full" />
        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
        <div className="w-1.5 h-1.5 bg-rose-500/50 rounded-full" />
      </motion.div>

      {/* Grid background subtle lines */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px', color: 'gray' }} />
    </div>
  );
};
