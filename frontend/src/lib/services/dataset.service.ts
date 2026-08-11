import api from '@/lib/api'

export const DatasetService = {
  async getDatasets(): Promise<any[]> {
    const res = await api.get('/tenant-datasets')
    return res.data.data
  },

  async getDatasetProfile(id: string): Promise<any> {
    const res = await api.get(`/datasets/${id}`)
    return res.data
  },

  async getDatasetSchema(id: string): Promise<any> {
    const res = await api.get(`/tenant-datasets/${id}/schema`)
    return res.data.data
  },

  async queryStructured(id: string, queryConfig: any, signal?: AbortSignal): Promise<any> {
    const res = await api.post(`/datasets/${id}/query/structured`, queryConfig, { signal })
    return res.data
  }
}
