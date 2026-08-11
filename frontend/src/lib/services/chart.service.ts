import api from '../api';

export interface ChartBase {
  name: string;
  description?: string;
  chart_type: string;
  dataset_id: string;
  configuration_json: Record<string, any>;
  visibility: string;
  status: string;
}

export interface Chart extends ChartBase {
  id: string;
  tenant_id: string;
  workspace_id?: string;
  created_by_id?: string;
  view_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChartListResponse {
  items: Chart[];
  total: number;
}

export const ChartService = {
  getCharts: async (params?: { search?: string; dataset_id?: string; skip?: number; limit?: number }): Promise<ChartListResponse> => {
    const response = await api.get('/tenant-charts', { params });
    return response.data;
  },

  getChart: async (id: string): Promise<Chart> => {
    const response = await api.get(`/tenant-charts/${id}`);
    return response.data;
  },

  createChart: async (data: ChartBase): Promise<Chart> => {
    const response = await api.post('/tenant-charts/', data);
    return response.data;
  },

  updateChart: async (id: string, data: Partial<ChartBase>): Promise<Chart> => {
    const response = await api.put(`/tenant-charts/${id}`, data);
    return response.data;
  },

  deleteChart: async (id: string): Promise<{ status: string; message: string }> => {
    const response = await api.delete(`/tenant-charts/${id}`);
    return response.data;
  },
};
