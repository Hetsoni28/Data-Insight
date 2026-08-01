import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  type?: string;
  status: string;
  tenant_id?: string;
  user_id?: string;
  metadata_json?: Record<string, any>;
  is_read: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  action_url?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  security: number;
  ai: number;
  billing: number;
  system: number;
  organization: number;
}

export interface NotificationFilters {
  category?: string;
  priority?: string;
  is_read?: boolean;
  is_archived?: boolean;
  is_pinned?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export const NotificationService = {
  async getNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value.toString());
    });
    
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  async getStats(): Promise<NotificationStats> {
    const response = await api.get('/notifications/stats');
    return response.data;
  },

  async updateNotification(id: string, updates: { is_read?: boolean; is_pinned?: boolean; is_archived?: boolean }): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}`, updates);
    return response.data;
  },

  async markAllAsRead(): Promise<{ status: string, updated_count: number }> {
    const response = await api.post('/notifications/bulk?action=mark_read');
    return response.data;
  },
  
  async archiveAll(): Promise<{ status: string, updated_count: number }> {
    const response = await api.post('/notifications/bulk?action=archive');
    return response.data;
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async seedDemoData(): Promise<any> {
    const response = await api.post('/notifications/seed');
    return response.data;
  },

  async updatePreferences(prefs: Record<string, boolean>): Promise<void> {
    await api.patch('/notifications/preferences', prefs);
  }
};
