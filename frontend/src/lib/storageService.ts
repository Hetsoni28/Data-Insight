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
  },

  createBucket: async (data: { name: string; bucket_type?: string; is_public?: boolean; description?: string; region?: string }) => {
    const response = await api.post('/owner/storage/buckets', data);
    return response.data;
  },

  deleteBucket: async (bucketId: string) => {
    const response = await api.delete(`/owner/storage/buckets/${bucketId}`);
    return response.data;
  },

  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/owner/storage/files/${fileId}`);
    return response.data;
  },

  uploadFile: async (formData: FormData) => {
    const response = await api.post('/owner/storage/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

