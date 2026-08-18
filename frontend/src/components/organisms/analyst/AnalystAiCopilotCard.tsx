"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/atoms/Logo';

import { usePathname } from 'next/navigation';

export function AnalystAiCopilotCard() {
  const pathname = usePathname();
  const roleMatch = pathname?.match(/^\/(owner|organization-admin|manager|analyst|viewer)/);
  const basePath = roleMatch ? roleMatch[0] : '/analyst';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="lg:col-span-1"
    >
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-emerald-500/20 dark:border-slate-800 rounded-3xl p-6 sm:p-7 text-white h-full flex flex-col shadow-xl shadow-emerald-950/10 dark:shadow-none relative overflow-hidden group">
        
        {/* Ambient Logo SVG Background Glow */}
        <div className="absolute -top-4 -right-4 opacity-15 dark:opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none scale-125">
          <Logo size={140} showText={false} href={null} whiteMode />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 dark:bg-emerald-500/10 rounded-2xl border border-white/20 dark:border-emerald-500/20 backdrop-blur-md shadow-inner flex items-center justify-center">
                <Logo size={28} showText={false} href={null} whiteMode />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white font-sans">
                  AI Copilot
                  <Sparkles className="w-4 h-4 text-emerald-300 dark:text-emerald-400 animate-pulse" />
                </h2>
                <p className="text-[11px] text-emerald-100/80 dark:text-slate-400 font-medium">
                  Powered by Enterprise LLM
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-emerald-100/90 dark:text-slate-300 mb-8 leading-relaxed font-medium">
            Ask natural language questions about your datasets. Instant correlation matrices, anomaly detection, and automated reports.
          </p>

          <div className="mt-auto space-y-3">
            <Link href={`${basePath}/dashboard/ai`} className="block w-full">
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                <Button
                  variant="secondary"
                  className="w-full justify-between text-emerald-950 bg-white hover:bg-emerald-50 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 shadow-md border-0 h-auto py-3.5 px-4 font-bold rounded-2xl group/btn transition-all"
                >
                  <span className="truncate flex items-center gap-2 text-xs">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-950 fill-emerald-600 dark:fill-emerald-950" />
                    Analyze my latest dataset...
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-700 dark:text-emerald-950 group-hover/btn:translate-x-1 transition-transform shrink-0" />
                </Button>
              </motion.div>
            </Link>

            <Link href={`${basePath}/dashboard/ai`} className="block w-full">
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                <Button
                  variant="secondary"
                  className="w-full justify-between text-white bg-white/15 hover:bg-white/25 dark:bg-slate-800/80 dark:text-slate-200 border border-white/20 dark:border-slate-700/60 h-auto py-3.5 px-4 font-semibold rounded-2xl backdrop-blur-md group/btn transition-all"
                >
                  <span className="truncate text-xs">Find anomalies in recent data...</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 dark:text-slate-400 group-hover/btn:translate-x-1 transition-transform shrink-0" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
