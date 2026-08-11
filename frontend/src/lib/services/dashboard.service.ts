import api from '@/lib/api'

export interface Dashboard {
  id: string
  name: string
  description?: string
  layout_json: any
  is_published: boolean
  created_at: string
  updated_at: string
}

export const DashboardService = {
  async getDashboards(): Promise<Dashboard[]> {
    const res = await api.get('/tenant-dashboards')
    return res.data
  },

  async getDashboard(id: string): Promise<Dashboard> {
    const res = await api.get(`/tenant-dashboards/${id}`)
    return res.data
  },

  async createDashboard(data: { name: string; description?: string }): Promise<Dashboard> {
    const res = await api.post('/tenant-dashboards', { ...data, layout_json: { widgets: [] } })
    return res.data
  },

  async updateDashboard(id: string, data: Partial<Dashboard>): Promise<Dashboard> {
    const res = await api.patch(`/tenant-dashboards/${id}`, data)
    return res.data
  },

  async deleteDashboard(id: string): Promise<void> {
    await api.delete(`/tenant-dashboards/${id}`)
  }
}
