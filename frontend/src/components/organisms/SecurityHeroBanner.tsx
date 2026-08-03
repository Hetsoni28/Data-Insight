'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, UserCheck, ShieldAlert, Activity } from 'lucide-react';

interface SecurityOverview {
    security_score: number;
    active_sessions: number;
    blocked_ips: number;
    critical_events: number;
    total_events: number;
}

interface SecurityHeroBannerProps {
    overview: SecurityOverview | undefined;
    isLoading: boolean;
}

export function SecurityHeroBanner({ overview, isLoading }: SecurityHeroBannerProps) {
    const isCritical = overview?.security_score && overview.security_score < 70;
    
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
                        <ShieldCheck className="h-8 w-8 text-emerald-400" />
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Security Operations Center
                        </h1>
                    </motion.div>
                    <p className="text-emerald-100/80 text-lg">
                        Monitor, secure, and protect the entire platform.
                    </p>
                </div>
                
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        {isCritical ? (
                            <ShieldAlert className="h-6 w-6 text-red-400" />
                        ) : (
                            <ShieldCheck className="h-6 w-6 text-green-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-white/70 font-medium">Platform Security Score</p>
                        <div className="flex items-baseline gap-2">
                            {isLoading ? (
                                <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
                            ) : (
                                <span className={`text-3xl font-bold ${isCritical ? 'text-red-400' : 'text-green-400'}`}>
                                    {overview?.security_score?.toFixed(0)}/100
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <MetricCard 
                    title="Critical Events" 
                    value={overview?.critical_events} 
                    icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
                    isLoading={isLoading}
                    trend="Unresolved threats"
                />
                <MetricCard 
                    title="Active Sessions" 
                    value={overview?.active_sessions} 
                    icon={<UserCheck className="h-5 w-5 text-blue-400" />}
                    isLoading={isLoading}
                    trend="Across the platform"
                />
                <MetricCard 
                    title="Blocked Threats" 
                    value={overview?.blocked_ips} 
                    icon={<ShieldAlert className="h-5 w-5 text-orange-400" />}
                    isLoading={isLoading}
                    trend="Known malicious IPs"
                />
                <MetricCard 
                    title="Total Events Logged" 
                    value={overview?.total_events} 
                    icon={<Activity className="h-5 w-5 text-indigo-400" />}
                    isLoading={isLoading}
                    trend="Since platform launch"
                />
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <span className="text-xs font-medium text-green-400 tracking-wider">LIVE TELEMETRY</span>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, isLoading, trend }: { title: string; value?: number; icon: React.ReactNode; isLoading: boolean; trend: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-none p-4 backdrop-blur-sm flex flex-col justify-between hover:bg-white/10 transition-colors">
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
