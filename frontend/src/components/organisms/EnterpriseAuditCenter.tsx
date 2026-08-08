'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditEvent, AuditTimelineEvent, AuditOverview } from '@/lib/auditOpsService';
import { formatDistanceToNow, format } from 'date-fns';
import { FileSearch, Clock, Filter, Download, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { PaginationControls } from '@/components/molecules/PaginationControls';

interface EnterpriseAuditCenterProps {
    events: AuditEvent[] | undefined;
    timeline: AuditTimelineEvent[] | undefined;
    overview: AuditOverview | undefined;
    isLoading: boolean;
    setFilterModule: (mod: string) => void;
    setFilterSeverity: (sev: string) => void;
    setSearchQuery: (query: string) => void;
}

export function EnterpriseAuditCenter({ events, timeline, overview, isLoading, setFilterModule, setFilterSeverity, setSearchQuery }: EnterpriseAuditCenterProps) {
    const [activeTab, setActiveTab] = useState<'log' | 'timeline'>('log');

    const tabs = [
        { id: 'log', label: 'Advanced Audit Log', icon: <FileSearch className="w-4 h-4" /> },
        { id: 'timeline', label: 'Audit Timeline', icon: <Clock className="w-4 h-4" /> },
    ];

    return (
        <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex space-x-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-full max-w-sm border border-transparent dark:border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                relative flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                                ${activeTab === tab.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}
                            `}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="auditTab"
                                    className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm border border-slate-200/60 dark:border-white/10 rounded-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab.icon}
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {activeTab === 'log' && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search action, IP, ID..." 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400" 
                            />
                        </div>
                        <select 
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="bg-white dark:bg-[#0B0F17] border border-slate-200/60 dark:border-white/10 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 dark:text-slate-300"
                        >
                            <option value="all">All Modules</option>
                            <option value="authentication">Authentication</option>
                            <option value="billing">Billing</option>
                            <option value="ai">AI Ops</option>
                            <option value="security">Security</option>
                            <option value="api">API</option>
                            <option value="storage">Storage</option>
                        </select>
                        <select 
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="bg-white dark:bg-[#0B0F17] border border-slate-200/60 dark:border-white/10 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 dark:text-slate-300"
                        >
                            <option value="all">All Severities</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                        <button onClick={() => {
                            if (!events) return;
                            const header = ['Timestamp', 'Action', 'Module', 'User', 'IP Address', 'Severity', 'Status'];
                            const rows = events.map(e => [
                                format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss'),
                                e.action,
                                e.module,
                                (e as any).actor || 'System',
                                e.ip_address || '',
                                e.severity,
                                e.status
                            ]);
                            const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `audit_log_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-slate-200">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                <AnimatePresence mode="wait">
                    {activeTab === 'log' && (
                        <motion.div key="log" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <AuditDataGrid events={events} isLoading={isLoading} />
                        </motion.div>
                    )}
                    {activeTab === 'timeline' && (
                        <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <AuditTimelineView timeline={timeline} isLoading={isLoading} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------

function AuditDataGrid({ events, isLoading }: { events?: AuditEvent[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

    const safeEvents = useMemo(() => events || [], [events]);
    const totalItems = safeEvents.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedEvents = useMemo(() =>
        safeEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [safeEvents, currentPage, pageSize]
    );

    if (isLoading) return <LoadingState />;

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-500">
                <FileSearch className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
                <p>No audit events found matching filters.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto flex flex-col h-full justify-between">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10">
                    <tr>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Timestamp</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Action</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Module</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Severity</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">IP Address</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Correlation ID</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-right">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {paginatedEvents.map((e) => (
                        <React.Fragment key={e.id}>
                        <tr onClick={() => setSelectedEvent(selectedEvent === e.id ? null : e.id)} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group ${selectedEvent === e.id ? 'bg-slate-50 dark:bg-white/5' : ''}`}>
                            <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                {format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss')}
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    {e.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                                    <span className="font-mono text-slate-900 dark:text-slate-100">{e.action}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200/60 dark:border-white/10 uppercase">
                                    {e.module}
                                </span>
                            </td>
                            <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${e.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                                      e.severity === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' : 
                                      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}
                                `}>
                                    {e.severity.toUpperCase()}
                                </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                {e.ip_address || '-'}
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-400 dark:text-slate-500">
                                {e.correlation_id ? e.correlation_id.substring(0, 8) + '...' : '-'}
                            </td>
                            <td className="p-4 text-right">
                                <button className="text-slate-400 group-hover:text-cyan-500 transition-colors">
                                    <ChevronRight className={`w-5 h-5 inline-block transition-transform ${selectedEvent === e.id ? 'rotate-90' : ''}`} />
                                </button>
                            </td>
                        </tr>
                        {selectedEvent === e.id && (
                            <tr>
                                <td colSpan={7} className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                                    <div className="text-sm text-slate-600 dark:text-slate-300">
                                        <strong>Expanded Details:</strong>
                                        <pre className="mt-2 p-2 bg-slate-100 dark:bg-black/40 rounded overflow-auto text-xs border border-slate-200/60 dark:border-white/10">{JSON.stringify(e, null, 2)}</pre>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
            
            <PaginationControls 
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />
        </div>
    );
}

function AuditTimelineView({ timeline, isLoading }: { timeline?: AuditTimelineEvent[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const totalItems = timeline?.length || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedTimeline = useMemo(() =>
        timeline?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [],
        [timeline, currentPage, pageSize]
    );

    if (isLoading) return <LoadingState />;

    return (
        <div className="flex flex-col h-full justify-between p-8">
            <div className="max-w-3xl mx-auto border-l-2 border-slate-200/60 dark:border-white/10 ml-4 md:ml-auto mb-6 w-full">
                {paginatedTimeline.map((t, idx) => (
                    <div key={t.id} className="relative pl-8 pb-8">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-[#0B0F17] 
                            ${t.severity === 'critical' ? 'bg-red-500' : t.severity === 'warning' ? 'bg-orange-500' : 'bg-cyan-500'}
                        `} />
                        
                        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border
                                        ${t.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                                          t.severity === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' : 
                                          'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}
                                    `}>
                                        {t.module}
                                    </span>
                                    <span className="font-mono text-sm font-semibold dark:text-white">{t.action}</span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                An event occurred requiring tracking. Status: <span className={t.status === 'success' ? 'text-green-500' : 'text-red-500'}>{t.status}</span>.
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            
            {totalItems > 0 && (
                <PaginationControls 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                />
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
            ))}
        </div>
    );
}
