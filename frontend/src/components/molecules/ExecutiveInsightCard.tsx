"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";

interface ExecutiveInsightCardProps {
  briefing: {
    business_growth?: string;
    churn_risk?: string;
    feature_adoption?: string;
    recommendations?: string[];
  } | null;
  loading?: boolean;
}

export function ExecutiveInsightCard({ briefing, loading }: ExecutiveInsightCardProps) {
  if (loading || !briefing) {
    return (
      <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-6 lg:p-8 relative overflow-hidden">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"></div>
            <div className="h-4 w-5/6 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-[#0B3B24] rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden group border border-[#108981]/20"
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>

      <div className="relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-8 pb-6 border-b border-emerald-500/10">
          <div className="p-1.5 bg-emerald-500/20 rounded-md ring-1 ring-emerald-500/30">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <h3 className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
            AI Executive Briefing
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Business & Growth */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
                <h4 className="font-semibold">Business Growth</h4>
              </div>
              <p className="text-slate-300 text-[15px] leading-relaxed">
                {briefing.business_growth}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3 text-amber-400">
                <Lightbulb className="h-5 w-5" />
                <h4 className="font-semibold">Feature Adoption</h4>
              </div>
              <p className="text-slate-300 text-[15px] leading-relaxed">
                {briefing.feature_adoption}
              </p>
            </div>
          </div>

          {/* Column 2: Risk & Churn */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="font-semibold">Risk & Churn Watch</h4>
              </div>
              <p className="text-slate-300 text-[15px] leading-relaxed bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                {briefing.churn_risk}
              </p>
            </div>
          </div>

          {/* Column 3: Recommended Actions */}
          <div className="lg:border-l lg:border-white/10 lg:pl-8">
            <div className="flex items-center gap-2 mb-4 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <h4 className="font-semibold">Recommended Actions</h4>
            </div>
            <ul className="space-y-4">
              {briefing.recommendations?.map((rec, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold ring-1 ring-emerald-500/40">
                    {i + 1}
                  </span>
                  <span className="text-slate-300 text-sm leading-relaxed block pt-0.5">
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
