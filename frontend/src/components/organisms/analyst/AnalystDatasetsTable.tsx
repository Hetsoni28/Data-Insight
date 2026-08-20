"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, ArrowUpRight, Search, FileSpreadsheet, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DashboardDataset } from '@/lib/tenantDashboard.service';

interface AnalystDatasetsTableProps {
  datasets?: DashboardDataset[];
  isLoading: boolean;
  onUploadClick: () => void;
}

const TableSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 animate-pulse shadow-sm">
    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
      ))}
    </div>
  </div>
);

export function AnalystDatasetsTable({
  datasets,
  isLoading,
  onUploadClick,
}: AnalystDatasetsTableProps) {
  const pathname = usePathname();
  const roleMatch = pathname?.match(/^\/(owner|organization-admin|manager|analyst|viewer)/);
  const basePath = roleMatch ? roleMatch[0] : '/analyst';

  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <TableSkeleton />
      </div>
    );
  }

  const filteredDatasets = (datasets || []).filter((ds) =>
    ds.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="lg:col-span-2"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              Authorized Datasets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Data available for AI query &amp; deep analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-44 sm:w-56 text-xs bg-slate-100 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 rounded-xl"
              />
            </div>
            <Link
              href={`${basePath}/dashboard/datasets`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Content */}
        {filteredDatasets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
            <div className="p-4 rounded-3xl bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20 shadow-inner">
              <Database className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No datasets found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 max-w-sm">
              {searchTerm
                ? `No dataset matches "${searchTerm}". Try another search keyword.`
                : 'Upload your first CSV/XLSX file to start running automated AI analytics.'}
            </p>
            <Button
              onClick={onUploadClick}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Upload Dataset
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Dataset Name</th>
                  <th className="px-6 py-4">Rows</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredDatasets.map((ds) => (
                  <tr
                    key={ds.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-[200px]">{ds.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {ds.rows != null ? ds.rows.toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {ds.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-xs">
                      {formatDistanceToNow(new Date(ds.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/analyst/dashboard/analytics?dataset=${ds.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl gap-1 transition-all"
                        >
                          Analyze <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
