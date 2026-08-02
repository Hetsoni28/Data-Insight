import api from './api';

export interface FeatureOverview {
    total_flags: number;
    enabled_flags: number;
    disabled_flags: number;
    active_rollouts: number;
    active_experiments: number;
}

export interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string;
    is_enabled: boolean;
    environment: string;
    tags: Record<string, any> | null;
    updated_at: string;
}

export interface FeatureRollout {
    id: string;
    flag_key: string;
    flag_name: string;
    percentage: number;
    target_roles: Record<string, any> | null;
    target_organizations: Record<string, any> | null;
}

export interface FeatureExperiment {
    id: string;
    flag_key: string;
    flag_name: string;
    name: string;
    traffic_allocation: number;
    status: string;
    confidence_score: number;
    winner: string | null;
}

export const featureOpsService = {
    getOverview: async (): Promise<FeatureOverview> => {
        const response = await api.get('/owner/features/overview');
        return response.data.kpis;
    },
    
    getFeatures: async (): Promise<FeatureFlag[]> => {
        const response = await api.get('/owner/features');
        return response.data.features;
    },

    toggleFeature: async (key: string, is_enabled: boolean): Promise<{status: string, is_enabled: boolean}> => {
        const response = await api.patch(`/owner/features/${key}/toggle`, { is_enabled });
        return response.data;
    },
    
    getRollouts: async (): Promise<FeatureRollout[]> => {
        const response = await api.get('/owner/features/rollouts');
        return response.data.rollouts;
    },
    
    getExperiments: async (): Promise<FeatureExperiment[]> => {
        const response = await api.get('/owner/features/experiments');
        return response.data.experiments;
    },

    createFeature: async (data: { key: string; name: string; description: string; environment: string }): Promise<FeatureFlag> => {
        const response = await api.post('/owner/features', data);
        return response.data;
    },

    triggerKillSwitch: async (): Promise<{ status: string; disabled_count: number }> => {
        const response = await api.post('/owner/features/kill-switch');
        return response.data;
    }
};
