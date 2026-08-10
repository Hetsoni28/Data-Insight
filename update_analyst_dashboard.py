import os

page_content = """\"\"\"client\"\"\"
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, Database, FileSpreadsheet, Activity, 
  Brain, RefreshCw, UploadCloud, AlertCircle, Clock, CheckCircle2, LayoutTemplate 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';

import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAuthStore } from '@/store/authStore';
import { tenantDashboardService } from '@/lib/tenantDashboard.service';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

// ----------------------------------------------------------------------
// Skeletons
// ----------------------------------------------------------------------
const KpiSkeleton = () => (
  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
    </div>
    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 h-[400px] animate-pulse flex flex-col">
    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 animate-pulse">
    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
      ))}
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------------
export default function AnalystDashboard() {
  const { user } = useAuthStore();
  const { activeWs, setIsUploadOpen } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fallback to avoid query keys being null
  const wsId = activeWs?.id || 'default';

  // --- Queries ---
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analystOverview', wsId],
    queryFn: tenantDashboardService.getOverview,
    enabled: !!activeWs,
  });

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ['analystKpis', wsId],
    queryFn: tenantDashboardService.getKpis,
    enabled: !!activeWs,
  });

  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ['analystCharts', wsId],
    queryFn: tenantDashboardService.getCharts,
    enabled: !!activeWs,
  });

  const { data: datasets, isLoading: loadingDatasets } = useQuery({
    queryKey: ['analystDatasets', wsId],
    queryFn: () => tenantDashboardService.getDatasets(0, 5),
    enabled: !!activeWs,
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['analystActivity', wsId],
    queryFn: () => tenantDashboardService.getActivity(0, 10),
    enabled: !!activeWs,
  });

  // --- Handlers ---
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analystOverview'] });
    await queryClient.invalidateQueries({ queryKey: ['analystKpis'] });
    await queryClient.invalidateQueries({ queryKey: ['analystCharts'] });
    await queryClient.invalidateQueries({ queryKey: ['analystDatasets'] });
    await queryClient.invalidateQueries({ queryKey: ['analystActivity'] });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // --- Render Helpers ---
  const greetingName = overview?.greeting || \Good morning, \\;
  const lastUpdated = new Date(); // In a real scenario, could track exact fetch time

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Analyst Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{greetingName}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md font-medium">
                <Database className="w-4 h-4" />
                Workspace: {activeWs?.name || 'Loading...'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Last updated: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={\w-4 h-4 \\} />
              Refresh
            </Button>
            <Button onClick={() => setIsUploadOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <UploadCloud className="w-4 h-4" />
              Upload Dataset
            </Button>
          </div>
        </div>

        {/* --- Executive KPIs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingKpis ? (
            Array(4).fill(0).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              {/* Total Datasets */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Datasets</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{kpis?.datasets.total || 0}</h3>
                  </div>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className={\ont-medium \\}>
                    {(kpis?.datasets.growth || 0) >= 0 ? '+' : ''}{kpis?.datasets.growth || 0}%
                  </span>
                  <span className="text-slate-500">vs last 30 days</span>
                </div>
              </div>

              {/* Storage & Records */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Processed</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {kpis?.storage_mb ? (kpis.storage_mb < 1024 ? \\ MB\ : \\ GB\) : '0 MB'}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Across authorized datasets</span>
                </div>
              </div>

              {/* Data Quality */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Quality</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{kpis?.data_quality_score || 0}%</h3>
                  </div>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Based on available validation metrics</span>
                </div>
              </div>

              {/* Reports */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Reports</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{kpis?.reports.total || 0}</h3>
                  </div>
                  <div className="p-2.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className={\ont-medium \\}>
                    {(kpis?.reports.growth || 0) >= 0 ? '+' : ''}{kpis?.reports.growth || 0}%
                  </span>
                  <span className="text-slate-500">vs last 30 days</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* --- Trends & Activity --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Chart */}
          <div className="lg:col-span-2">
            {loadingCharts ? <ChartSkeleton /> : (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Activity Trend</h2>
                  <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
                    Last 30 Days
                  </span>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#64748b' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reports" 
                        name="Reports Generated"
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorReports)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm h-[400px] flex flex-col">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {loadingActivity ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : activity?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm text-slate-500">No recent activity found.</p>
                  </div>
                ) : (
                  activity?.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700 group-hover:border-blue-500 transition-colors">
                        <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="capitalize">{log.resource_type}</span>
                          <span>&bull;</span>
                          <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Bottom Row: Datasets & AI Copilot --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Datasets Table */}
          <div className="lg:col-span-2">
            {loadingDatasets ? <TableSkeleton /> : (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Authorized Data</h2>
                  <Link href="/analyst/dashboard/datasets" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                    View All &rarr;
                  </Link>
                </div>
                
                {datasets?.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No datasets yet</h3>
                    <p className="text-slate-500 mt-1 mb-6">Upload your first dataset to start analyzing.</p>
                    <Button onClick={() => setIsUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      Upload Dataset
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/5">
                        <tr>
                          <th className="px-6 py-4 font-medium">Dataset</th>
                          <th className="px-6 py-4 font-medium">Rows</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Updated</th>
                          <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {datasets?.map((ds) => (
                          <tr key={ds.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              {ds.name}
                            </td>
                            <td className="px-6 py-4 text-slate-500">{ds.rows.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {ds.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {formatDistanceToNow(new Date(ds.created_at), { addSuffix: true })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link href={\/analyst/dashboard/analytics?dataset=\\}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                  Analyze
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
            )}
          </div>

          {/* AI Copilot Entry */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white h-full flex flex-col shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Brain className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">AI Copilot</h2>
                </div>
                
                <p className="text-indigo-100 mb-8 leading-relaxed">
                  Ask questions about your authorized data. Identify trends, anomalies, and generate instant insights.
                </p>
                
                <div className="mt-auto space-y-3">
                  <Link href="/analyst/dashboard/ai" className="block w-full">
                    <Button variant="secondary" className="w-full justify-start text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm border-0 h-auto py-3 px-4">
                      <span className="truncate">Analyze my latest dataset...</span>
                    </Button>
                  </Link>
                  <Link href="/analyst/dashboard/ai" className="block w-full">
                    <Button variant="secondary" className="w-full justify-start text-white bg-white/10 hover:bg-white/20 border-white/20 h-auto py-3 px-4">
                      <span className="truncate">Find anomalies in recent data...</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
"""

os.makedirs('frontend/src/app/analyst/dashboard', exist_ok=True)
with open('frontend/src/app/analyst/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_content.replace('\"\"\"client\"\"\"', '"use client";'))

