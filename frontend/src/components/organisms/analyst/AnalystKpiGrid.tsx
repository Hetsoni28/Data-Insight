"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Database, Activity, CheckCircle2, FileSpreadsheet, TrendingUp, ShieldCheck } from 'lucide-react';
import type { DashboardKPIs } from '@/lib/tenantDashboard.service';

interface AnalystKpiGridProps {
  kpis?: DashboardKPIs;
  isLoading: boolean;
}

const KpiSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 animate-pulse shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
    </div>
    <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3"></div>
    <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AnalystKpiGrid({ kpis, isLoading }: AnalystKpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  const items = [
    {
      title: 'Total Datasets',
      value: kpis?.datasets.total || 0,
      growth: kpis?.datasets.growth || 0,
      subText: 'vs last 30 days',
      icon: Database,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      title: 'Data Processed',
      value: kpis?.storage_mb
        ? kpis.storage_mb < 1024
          ? `${kpis.storage_mb} MB`
          : `${(kpis.storage_mb / 1024).toFixed(1)} GB`
        : '0 MB',
      subText: 'Across authorized datasets',
      icon: Activity,
      gradient: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-purple-500/20',
    },
    {
      title: 'Data Quality',
      value: `${kpis?.data_quality_score || 0}%`,
      subText: 'Based on validation rules',
      icon: ShieldCheck,
      gradient: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/20',
    },
    {
      title: 'Active Reports',
      value: kpis?.reports.total || 0,
      growth: kpis?.reports.growth || 0,
      subText: 'vs last 30 days',
      icon: FileSpreadsheet,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {item.title}
                </p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
                  {item.value}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-md ${item.shadow} group-hover:rotate-6 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs relative z-10 pt-2 border-t border-slate-100 dark:border-slate-800">
              {item.growth !== undefined ? (
                <span className={`inline-flex items-center gap-1 font-bold ${item.growth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  <TrendingUp className={`w-3.5 h-3.5 ${item.growth < 0 ? 'rotate-180' : ''}`} />
                  {item.growth >= 0 ? '+' : ''}{item.growth}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500 font-medium">{item.subText}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
