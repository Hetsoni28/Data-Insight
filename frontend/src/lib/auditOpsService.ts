import api from './api';

export interface AuditOverview {
    total_events: number;
    today_events: number;
    critical_events: number;
    failed_events: number;
    module_counts: Record<string, number>;
}

export interface AuditEvent {
    id: string;
    action: string;
    module: string;
    severity: 'info' | 'warning' | 'critical';
    status: 'success' | 'failure';
    ip_address: string;
    user_id: string | null;
    actor_user_id: string | null;
    correlation_id: string | null;
    old_value: Record<string, any> | null;
    new_value: Record<string, any> | null;
    created_at: string;
}

export interface AuditEventsResponse {
    total: number;
    events: AuditEvent[];
}

export interface AuditTimelineEvent {
    id: string;
    action: string;
    module: string;
    severity: string;
    status: string;
    created_at: string;
}

export const auditOpsService = {
    getOverview: async (): Promise<AuditOverview> => {
        const response = await api.get('/owner/audit/overview');
        return response.data.kpis;
    },
    
    getEvents: async (limit = 50, offset = 0, module?: string, severity?: string, search?: string): Promise<AuditEventsResponse> => {
        const params: Record<string, any> = { limit, offset };
        if (module && module !== 'all') params.module = module;
        if (severity && severity !== 'all') params.severity = severity;
        if (search) params.search = search;
        
        const response = await api.get('/owner/audit/events', { params });
        return response.data;
    },
    
    getTimeline: async (limit = 20): Promise<AuditTimelineEvent[]> => {
        const response = await api.get('/owner/audit/timeline', { params: { limit } });
        return response.data.timeline;
    }
};
