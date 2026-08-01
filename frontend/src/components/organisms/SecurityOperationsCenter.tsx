'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecurityEvent, ThreatIntelligence, UserSession, ComplianceReport } from '@/lib/securityOpsService';
import { ShieldCheck, ShieldAlert, Globe, MonitorSmartphone, FileCheck2, AlertCircle, MapPin, Search } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { PaginationControls } from '@/components/molecules/PaginationControls';

interface SecurityOperationsCenterProps {
    events: SecurityEvent[] | undefined;
    threats: ThreatIntelligence[] | undefined;
    sessions: UserSession[] | undefined;
    compliance: ComplianceReport[] | undefined;
    isLoading: boolean;
}

export function SecurityOperationsCenter({ events, threats, sessions, compliance, isLoading }: SecurityOperationsCenterProps) {
    const [activeTab, setActiveTab] = useState<'events' | 'threats' | 'sessions' | 'compliance'>('events');

    const tabs = [
        { id: 'events', label: 'Live Events', icon: <AlertCircle className="w-4 h-4" /> },
        { id: 'threats', label: 'Threat Intelligence', icon: <Globe className="w-4 h-4" /> },
        { id: 'sessions', label: 'Sessions', icon: <MonitorSmartphone className="w-4 h-4" /> },
        { id: 'compliance', label: 'Compliance', icon: <FileCheck2 className="w-4 h-4" /> },
    ];

    return (
        <div className="mt-8">
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full max-w-2xl mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            relative flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                            ${activeTab === tab.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg"
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

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'events' && (
                        <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <EventsTable events={events} isLoading={isLoading} />
                        </motion.div>
                    )}
                    {activeTab === 'threats' && (
                        <motion.div key="threats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <ThreatsBoard threats={threats} isLoading={isLoading} />
                        </motion.div>
                    )}
                    {activeTab === 'sessions' && (
                        <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <SessionsTable sessions={sessions} isLoading={isLoading} />
                        </motion.div>
                    )}
                    {activeTab === 'compliance' && (
                        <motion.div key="compliance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <ComplianceBoard compliance={compliance} isLoading={isLoading} />
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

function EventsTable({ events, isLoading }: { events?: SecurityEvent[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (isLoading) return <LoadingState />;

    const totalItems = events?.length || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedEvents = events?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

    return (
        <div className="overflow-x-auto flex flex-col h-full justify-between">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Time</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Severity</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Event Type</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Actor / IP</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paginatedEvents.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 text-slate-600 dark:text-slate-300">
                                {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                            </td>
                            <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border
                                    ${e.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                                      e.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' : 
                                      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20'}
                                `}>
                                    {e.severity.toUpperCase()}
                                </span>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                                {e.event_type}
                            </td>
                            <td className="p-4">
                                <div className="text-slate-900 dark:text-slate-100">{e.actor}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">{e.ip_address}</div>
                            </td>
                            <td className="p-4">
                                {e.resolved ? (
                                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Resolved</span>
                                ) : (
                                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><ShieldAlert className="w-4 h-4"/> Active</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {totalItems === 0 && (
                        <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                                No security events recorded.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
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

function ThreatsBoard({ threats, isLoading }: { threats?: ThreatIntelligence[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (isLoading) return <LoadingState />;

    const totalItems = threats?.length || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedThreats = threats?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

    return (
        <div className="p-6 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold dark:text-white">Active Threat Intelligence</h3>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search IP or Country..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedThreats.map((t) => (
                    <div key={t.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono font-medium text-red-600 dark:text-red-400">{t.indicator_value}</span>
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-xs rounded text-slate-600 dark:text-slate-300">{t.threat_type}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-4">
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {t.country || 'Unknown'}</div>
                            <div>Score: <span className="font-medium text-slate-700 dark:text-slate-300">{t.reputation_score}</span></div>
                        </div>
                    </div>
                ))}
                {totalItems === 0 && (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm col-span-full">
                        No threat intelligence indicators active.
                    </div>
                )}
            </div>
            
            {totalItems > 0 && (
                <div className="mt-auto">
                    <PaginationControls 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            )}
        </div>
    );
}

function SessionsTable({ sessions, isLoading }: { sessions?: UserSession[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (isLoading) return <LoadingState />;

    const totalItems = sessions?.length || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedSessions = sessions?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

    return (
        <div className="overflow-x-auto flex flex-col h-full justify-between">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Device</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Location / IP</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Last Active</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paginatedSessions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                                <div className="text-slate-900 dark:text-slate-100 font-medium">{s.device_name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-500">{s.os} • {s.browser}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-slate-900 dark:text-slate-100">{s.location}</div>
                                <div className="text-xs font-mono text-slate-500 dark:text-slate-500">{s.ip_address}</div>
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300">
                                {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                            </td>
                            <td className="p-4 text-right">
                                <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium border border-red-200 dark:border-red-900 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                    Revoke
                                </button>
                            </td>
                        </tr>
                    ))}
                    {totalItems === 0 && (
                        <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                                No active user sessions found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
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

function ComplianceBoard({ compliance, isLoading }: { compliance?: ComplianceReport[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    if (isLoading) return <LoadingState />;

    const totalItems = compliance?.length || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedCompliance = compliance?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {paginatedCompliance.map((c) => (
                <div key={c.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold dark:text-white">{c.framework}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${c.status === 'compliant' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                              c.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400' :
                              c.status === 'unaudited' ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' :
                              'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}
                        `}>
                            {c.status.toUpperCase()}
                        </span>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500 dark:text-slate-400">Compliance Score</span>
                            <span className="font-bold dark:text-white">{c.score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div className={`h-2 rounded-full ${c.score > 90 ? 'bg-green-500' : c.score > 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.score}%` }}></div>
                        </div>
                    </div>

                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <div><span className="font-medium text-green-600 dark:text-green-400">{c.controls_passed}</span> Controls Passed</div>
                        <div><span className="font-medium text-red-600 dark:text-red-400">{c.controls_failed}</span> Failed</div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-500 flex justify-between">
                        <span>Last Audit: {c.last_audit_at ? format(new Date(c.last_audit_at), 'MMM d, yyyy') : 'Never'}</span>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:underline">Download Report</button>
                    </div>
                </div>
            ))}
            {totalItems === 0 && (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm col-span-full">
                    No compliance frameworks audited.
                </div>
            )}
            </div>
            
            {totalItems > 0 && (
                <div className="px-6 pb-6 mt-auto">
                    <PaginationControls 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
        </div>
    );
}
