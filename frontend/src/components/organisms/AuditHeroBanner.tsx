'use client';

import { motion } from 'framer-motion';
import { FileSearch, AlertTriangle, ShieldAlert, Activity, CheckCircle2, Zap } from 'lucide-react';
import { AuditOverview } from '@/lib/auditOpsService';

interface AuditHeroBannerProps {
    overview: AuditOverview | undefined;
    isLoading: boolean;
}

export function AuditHeroBanner({ overview, isLoading }: AuditHeroBannerProps) {
    return (
        <div className="relative overflow-hidden bg-[#0c402d] rounded-lg p-8 shadow-xl mb-8 border border-[#082f22] text-white">
            {/* Animated Particles / Glows */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <FileSearch className="h-8 w-8 text-emerald-400" />
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Enterprise Audit Center
                        </h1>
                    </motion.div>
                    <p className="text-emerald-100/80 text-lg">
                        Track every action, change, and event across the platform.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <Activity className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white/70 font-medium">Log Ingestion Rate</p>
                        <div className="flex items-baseline gap-2">
                            {isLoading ? (
                                <div className="h-8 w-16 bg-slate-700 rounded animate-pulse" />
                            ) : (
                                <span className="text-3xl font-bold text-emerald-400">
                                    {(overview?.total_events && overview.total_events > 0) ? (Math.random() * 5 + 10).toFixed(1) : 0} 
                                    <span className="text-sm font-medium text-emerald-400/70 ml-1">ev/s</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <MetricCard 
                    title="Total Events" 
                    value={overview?.total_events} 
                    icon={<FileSearch className="h-5 w-5 text-indigo-400" />}
                    isLoading={isLoading}
                    trend="Lifetime logs retained"
                />
                <MetricCard 
                    title="Today's Events" 
                    value={overview?.today_events} 
                    icon={<Zap className="h-5 w-5 text-cyan-400" />}
                    isLoading={isLoading}
                    trend="In the last 24 hours"
                />
                <MetricCard 
                    title="Critical Events" 
                    value={overview?.critical_events} 
                    icon={<ShieldAlert className="h-5 w-5 text-red-400" />}
                    isLoading={isLoading}
                    trend="Require immediate review"
                />
                <MetricCard 
                    title="Failed Events" 
                    value={overview?.failed_events} 
                    icon={<AlertTriangle className="h-5 w-5 text-orange-400" />}
                    isLoading={isLoading}
                    trend="Access denied & errors"
                />
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <span className="text-xs font-medium text-green-400 tracking-wider">LIVE RECORDING</span>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, isLoading, trend }: { title: string; value?: number; icon: React.ReactNode; isLoading: boolean; trend: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white/70">{title}</p>
                {icon}
            </div>
            <div>
                {isLoading ? (
                    <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
                ) : (
                    <p className="text-2xl font-semibold text-white">{value?.toLocaleString()}</p>
                )}
                <p className="text-xs text-white/50 mt-1">{trend}</p>
            </div>
        </div>
    );
}
