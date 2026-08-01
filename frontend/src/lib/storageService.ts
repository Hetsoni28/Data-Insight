import api from './api';

export const storageService = {
  getOverview: async () => {
    const response = await api.get('/owner/storage/overview');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/owner/storage/analytics');
    return response.data;
  },

  getOrganizations: async () => {
    const response = await api.get('/owner/storage/organizations');
    return response.data;
  },

  getBuckets: async () => {
    const response = await api.get('/owner/storage/buckets');
    return response.data;
  },

  getFiles: async (params?: { q?: string; bucket_id?: string; limit?: number }) => {
    const response = await api.get('/owner/storage/files', { params });
    return response.data;
  },

  getBackups: async () => {
    const response = await api.get('/owner/storage/backups');
    return response.data;
  },

  getActivity: async () => {
    const response = await api.get('/owner/storage/activity');
    return response.data;
  },

  getSecurity: async () => {
    const response = await api.get('/owner/storage/security');
    return response.data;
  }
};
