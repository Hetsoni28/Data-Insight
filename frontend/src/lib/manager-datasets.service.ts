import api from './api'

export const managerDatasetsService = {
  getDatasets: async (params: {
    search?: string;
    status?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    skip?: number;
    limit?: number;
  }) => {
    const { search, status, sort_by = 'created_at', sort_dir = 'desc', skip = 0, limit = 25 } = params;
    let url = `/manager/datasets?skip=${skip}&limit=${limit}&sort_by=${sort_by}&sort_dir=${sort_dir}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/manager/datasets/summary');
    return response.data;
  },

  getDatasetDetails: async (id: string) => {
    const response = await api.get(`/manager/datasets/${id}`);
    return response.data;
  },

  getDatasetPreview: async (id: string, limit: number = 50) => {
    const response = await api.get(`/manager/datasets/${id}/preview?limit=${limit}`);
    return response.data;
  },

  getDatasetActivity: async (id: string, skip: number = 0, limit: number = 25) => {
    const response = await api.get(`/manager/datasets/${id}/activity?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  deleteDataset: async (id: string) => {
    const response = await api.delete(`/manager/datasets/${id}`);
    return response.data;
  }
}
