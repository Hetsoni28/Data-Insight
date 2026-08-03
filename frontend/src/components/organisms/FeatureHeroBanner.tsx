'use client';

import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToggleRight, Activity, PercentCircle, TestTubes, Power } from 'lucide-react';
import { FeatureOverview, featureOpsService } from '@/lib/featureOpsService';
import { toast } from 'sonner';

interface FeatureHeroBannerProps {
    overview: FeatureOverview | undefined;
    isLoading: boolean;
}

export function FeatureHeroBanner({ overview, isLoading }: FeatureHeroBannerProps) {
    const queryClient = useQueryClient();

    const killSwitchMutation = useMutation({
        mutationFn: featureOpsService.triggerKillSwitch,
        onSuccess: (data) => {
            toast.error(`KILL SWITCH ACTIVATED: ${data.disabled_count} flags disabled`);
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            queryClient.invalidateQueries({ queryKey: ['feature-overview'] });
        },
        onError: () => {
            toast.error("Failed to activate kill switch");
        }
    });

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
                        <ToggleRight className="h-8 w-8 text-emerald-400" />
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Enterprise Feature Management
                        </h1>
                    </motion.div>
                    <p className="text-emerald-100/80 text-lg">
                        Control rollouts, experiments, and kill switches globally.
                    </p>
                </div>
                
                <button 
                    onClick={() => killSwitchMutation.mutate()}
                    disabled={killSwitchMutation.isPending}
                    className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-red-500/30 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 text-left"
                >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 animate-pulse">
                        <Power className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-white/90 font-bold uppercase tracking-widest">Kill Switch Center</p>
                        <p className="text-xs text-white/60">
                            {killSwitchMutation.isPending ? "Activating..." : "0 Active Overrides"}
                        </p>
                    </div>
                </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <MetricCard 
                    title="Total Features" 
                    value={overview?.total_flags} 
                    icon={<ToggleRight className="h-5 w-5 text-indigo-400" />}
                    isLoading={isLoading}
                    trend="Managed globally"
                />
                <MetricCard 
                    title="Enabled in Prod" 
                    value={overview?.enabled_flags} 
                    icon={<Activity className="h-5 w-5 text-green-400" />}
                    isLoading={isLoading}
                    trend="Active for users"
                />
                <MetricCard 
                    title="Active Rollouts" 
                    value={overview?.active_rollouts} 
                    icon={<PercentCircle className="h-5 w-5 text-cyan-400" />}
                    isLoading={isLoading}
                    trend="Progressive delivery"
                />
                <MetricCard 
                    title="A/B Experiments" 
                    value={overview?.active_experiments} 
                    icon={<TestTubes className="h-5 w-5 text-purple-400" />}
                    isLoading={isLoading}
                    trend="Collecting data"
                />
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
