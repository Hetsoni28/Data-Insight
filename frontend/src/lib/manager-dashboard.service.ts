import api from './api'

export const managerDashboardService = {
  getOverview: async () => {
    const response = await api.get('/manager-dashboard/overview')
    return response.data
  },
  
  getKpis: async () => {
    const response = await api.get('/manager-dashboard/kpis')
    return response.data
  },
  
  getCharts: async () => {
    const response = await api.get('/manager-dashboard/charts')
    return response.data
  },
  
  getDatasets: async (skip = 0, limit = 5) => {
    const response = await api.get(`/manager-dashboard/datasets?skip=${skip}&limit=${limit}`)
    return response.data
  },
  
  getReports: async (skip = 0, limit = 5) => {
    const response = await api.get(`/manager-dashboard/reports?skip=${skip}&limit=${limit}`)
    return response.data
  },
  
  getActivityFeed: async (skip = 0, limit = 15) => {
    const response = await api.get(`/manager-dashboard/activity?skip=${skip}&limit=${limit}`)
    return response.data
  }
}
