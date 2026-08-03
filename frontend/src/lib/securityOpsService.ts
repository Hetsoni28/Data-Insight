import api from './api';

export interface SecurityOverview {
    security_score: number;
    active_sessions: number;
    blocked_ips: number;
    critical_events: number;
    total_events: number;
}

export interface SecurityEvent {
    id: string;
    event_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    ip_address: string;
    location: string;
    actor: string;
    metadata: Record<string, any>;
    resolved: boolean;
    created_at: string;
}

export interface ThreatIntelligence {
    id: string;
    indicator_value: string;
    indicator_type: string;
    threat_type: string;
    country: string;
    reputation_score: number;
    is_blocked: boolean;
    last_seen_at: string;
}

export interface UserSession {
    id: string;
    user_id: string;
    user_email?: string;
    user_name?: string;
    user_role?: string;
    device_name: string;
    os: string;
    browser: string;
    ip_address: string;
    location: string;
    last_active_at: string;
    created_at: string;
}

export interface ComplianceReport {
    id: string;
    framework: string;
    status: 'compliant' | 'warning' | 'critical' | 'unaudited';
    score: number;
    controls_passed: number;
    controls_failed: number;
    last_audit_at: string | null;
}

export const securityOpsService = {
    getOverview: async (): Promise<SecurityOverview> => {
        const response = await api.get('/owner/security/overview');
        return response.data.kpis;
    },
    
    getEvents: async (limit = 50): Promise<SecurityEvent[]> => {
        const response = await api.get('/owner/security/events', { params: { limit } });
        return response.data.events;
    },
    
    getThreats: async (limit = 50): Promise<ThreatIntelligence[]> => {
        const response = await api.get('/owner/security/threats', { params: { limit } });
        return response.data.threats;
    },
    
    getSessions: async (limit = 50): Promise<UserSession[]> => {
        const response = await api.get('/owner/security/sessions', { params: { limit } });
        return response.data.sessions;
    },
    
    getCompliance: async (): Promise<ComplianceReport[]> => {
        const response = await api.get('/owner/security/compliance');
        return response.data.reports;
    }
};
