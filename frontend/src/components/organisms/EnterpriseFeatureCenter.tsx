'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FeatureFlag, FeatureRollout, FeatureExperiment, FeatureOverview, featureOpsService } from '@/lib/featureOpsService';
import { ToggleRight, Activity, PercentCircle, TestTubes, Search, Power, Zap, AlertTriangle, Users, GitMerge, X } from 'lucide-react';
import { PaginationControls } from '@/components/molecules/PaginationControls';
import { toast } from 'sonner';

interface EnterpriseFeatureCenterProps {
    features: FeatureFlag[] | undefined;
    rollouts: FeatureRollout[] | undefined;
    experiments: FeatureExperiment[] | undefined;
    isLoading: boolean;
    refetchFeatures: () => void;
}

export function EnterpriseFeatureCenter({ features, rollouts, experiments, isLoading, refetchFeatures }: EnterpriseFeatureCenterProps) {
    const [activeTab, setActiveTab] = useState<'flags' | 'rollouts' | 'experiments'>('flags');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newFlagData, setNewFlagData] = useState({ key: '', name: '', description: '', environment: 'production' });

    const createFeatureMutation = useMutation({
        mutationFn: featureOpsService.createFeature,
        onSuccess: () => {
            toast.success("Feature flag created successfully!");
            refetchFeatures();
            setIsCreateOpen(false);
            setNewFlagData({ key: '', name: '', description: '', environment: 'production' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create feature flag");
        }
    });

    const handleCreateFlag = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFlagData.key || !newFlagData.name) {
            toast.error("Key and Name are required");
            return;
        }
        createFeatureMutation.mutate(newFlagData);
    };

    const tabs = [
        { id: 'flags', label: 'Global Flags', icon: <ToggleRight className="w-4 h-4" /> },
        { id: 'rollouts', label: 'Progressive Rollouts', icon: <PercentCircle className="w-4 h-4" /> },
        { id: 'experiments', label: 'A/B Experiments', icon: <TestTubes className="w-4 h-4" /> },
    ];

    const handleToggle = async (key: string, currentState: boolean) => {
        try {
            const newState = !currentState;
            await featureOpsService.toggleFeature(key, newState);
            toast.success(`Feature ${newState ? 'Enabled' : 'Disabled'}`, {
                description: `Successfully updated global state for ${key}.`
            });
            refetchFeatures();
        } catch (error) {
            toast.error("Failed to toggle feature");
        }
    };

    return (
        <div className="mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex space-x-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-full max-w-lg border border-transparent dark:border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                relative flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                                ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}
                            `}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="featureTab"
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

                {activeTab === 'flags' && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search features..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400" 
                            />
                        </div>
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCreateOpen ? 'bg-emerald-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                            Create Flag
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-sm transition-all duration-300">
                <AnimatePresence mode="wait">
                    {activeTab === 'flags' && (
                        <motion.div key="flags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <FlagsGrid 
                                features={features?.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.key.toLowerCase().includes(searchQuery.toLowerCase()))} 
                                isLoading={isLoading} 
                                onToggle={handleToggle}
                            />
                        </motion.div>
                    )}
                    {activeTab === 'rollouts' && (
                        <motion.div key="rollouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <RolloutsGrid rollouts={rollouts} isLoading={isLoading} />
                        </motion.div>
                    )}
                    {activeTab === 'experiments' && (
                        <motion.div key="experiments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ExperimentsGrid experiments={experiments} isLoading={isLoading} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Feature Flag Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={() => setIsCreateOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white dark:bg-card/95 dark:backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200/60 dark:border-white/10"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Feature Flag</h3>
                                <button
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreateFlag} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Flag Key</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. new_dashboard_ui"
                                        value={newFlagData.key}
                                        onChange={(e) => setNewFlagData({...newFlagData, key: e.target.value})}
                                        className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                    <input
                                        type="text"
                                        placeholder="New Dashboard UI"
                                        value={newFlagData.name}
                                        onChange={(e) => setNewFlagData({...newFlagData, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                    <textarea
                                        placeholder="Brief description of the feature..."
                                        value={newFlagData.description}
                                        onChange={(e) => setNewFlagData({...newFlagData, description: e.target.value})}
                                        className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-24 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Environment</label>
                                    <select
                                        value={newFlagData.environment}
                                        onChange={(e) => setNewFlagData({...newFlagData, environment: e.target.value})}
                                        className="w-full px-4 py-2 bg-white dark:bg-card border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createFeatureMutation.isPending}
                                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {createFeatureMutation.isPending ? "Creating..." : "Create Feature Flag"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ----------------------------------------------------------------------
// Flags Grid
// ----------------------------------------------------------------------
function FlagsGrid({ features, isLoading, onToggle }: { features?: FeatureFlag[], isLoading: boolean, onToggle: (k:string, s:boolean) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // All hooks MUST be called before any conditional return (Rules of Hooks)
    const safeFeatures = features ?? [];
    const totalItems = safeFeatures.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedFeatures = useMemo(() =>
        safeFeatures.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [safeFeatures, currentPage, pageSize]
    );

    if (isLoading) return <LoadingState />;
    if (safeFeatures.length === 0) return <EmptyState />;

    return (
        <div className="overflow-x-auto flex flex-col h-full justify-between rounded-2xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10">
                    <tr>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Feature</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Environment</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400">Module</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-right">Status</th>
                        <th className="p-4 font-medium text-slate-500 dark:text-slate-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {paginatedFeatures.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="p-4">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{f.name}</span>
                                    <span className="font-mono text-xs text-slate-500">{f.key}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 rounded-md text-xs font-medium uppercase">
                                    {f.environment}
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="text-slate-600 dark:text-slate-400 capitalize">
                                    {f.tags?.module || 'System'}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <span className={`inline-flex items-center gap-1.5 ${f.is_enabled ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    <span className={`h-2 w-2 rounded-full ${f.is_enabled ? 'bg-green-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`} />
                                    {f.is_enabled ? 'Serving' : 'Disabled'}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => onToggle(f.key, f.is_enabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${f.is_enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-white/10'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${f.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </td>
                        </tr>
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

// ----------------------------------------------------------------------
// Rollouts Grid
// ----------------------------------------------------------------------
function RolloutsGrid({ rollouts, isLoading }: { rollouts?: FeatureRollout[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const safeRollouts = rollouts ?? [];
    const totalItems = safeRollouts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedRollouts = useMemo(() =>
        safeRollouts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [safeRollouts, currentPage, pageSize]
    );

    if (isLoading) return <LoadingState />;
    if (safeRollouts.length === 0) return <EmptyState />;

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedRollouts.map(r => (
                <div key={r.id} className="border border-slate-200/60 dark:border-white/10 rounded-xl p-5 bg-slate-50 dark:bg-white/5 hover:border-indigo-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{r.flag_name}</h3>
                            <p className="font-mono text-xs text-slate-500 mt-1">{r.flag_key}</p>
                        </div>
                        <PercentCircle className="w-5 h-5 text-cyan-500" />
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Rollout Progress</span>
                            <span className="font-bold text-slate-900 dark:text-white">{r.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                            <div className="bg-cyan-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${r.percentage}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/10 pt-3">
                        <Users className="w-3.5 h-3.5" />
                        Targeting: {r.target_roles ? 'Specific Roles' : (r.target_organizations ? 'Specific Orgs' : 'Global Audience')}
                    </div>
                </div>
            ))}
            </div>
            
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
        </div>
    );
}

// ----------------------------------------------------------------------
// Experiments Grid
// ----------------------------------------------------------------------
function ExperimentsGrid({ experiments, isLoading }: { experiments?: FeatureExperiment[], isLoading: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const safeExperiments = experiments ?? [];
    const totalItems = safeExperiments.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedExperiments = useMemo(() =>
        safeExperiments.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [safeExperiments, currentPage, pageSize]
    );

    if (isLoading) return <LoadingState />;
    if (safeExperiments.length === 0) return <EmptyState />;

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                {paginatedExperiments.map(exp => (
                <div key={exp.id} className="border border-slate-200/60 dark:border-white/10 rounded-xl p-5 bg-slate-50 dark:bg-white/5 relative overflow-hidden">
                    {exp.status === 'running' && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Running
                        </div>
                    )}
                    {exp.status === 'completed' && (
                        <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Completed
                        </div>
                    )}

                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <TestTubes className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{exp.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <GitMerge className="w-3.5 h-3.5" /> {exp.flag_name}
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className={`p-4 rounded-lg border ${exp.winner === 'variation_a' ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : 'border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5'}`}>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">VARIATION A (Control)</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {exp.traffic_allocation}% Traffic
                            </p>
                            {exp.winner === 'variation_a' && <span className="text-xs font-bold text-green-600 mt-2 block flex items-center gap-1"><Zap className="w-3 h-3"/> WINNER</span>}
                        </div>
                        <div className={`p-4 rounded-lg border ${exp.winner === 'variation_b' ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : 'border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5'}`}>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">VARIATION B (Treatment)</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {100 - exp.traffic_allocation}% Traffic
                            </p>
                            {exp.winner === 'variation_b' && <span className="text-xs font-bold text-green-600 mt-2 block flex items-center gap-1"><Zap className="w-3 h-3"/> WINNER</span>}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm border-t border-slate-200/60 dark:border-white/10 pt-3">
                        <span className="text-slate-600 dark:text-slate-400">Statistical Confidence</span>
                        <span className={`font-bold ${exp.confidence_score >= 95 ? 'text-green-600 dark:text-green-400' : 'text-orange-500'}`}>
                            {exp.confidence_score}%
                        </span>
                    </div>
                </div>
            ))}
            </div>
            
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
        </div>
    );
}

// ----------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------
function LoadingState() {
    return (
        <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-slate-500">
            <ToggleRight className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
            <p>No feature flags found.</p>
        </div>
    );
}
