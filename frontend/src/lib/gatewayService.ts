import api from "./api"

export const gatewayService = {
  getOverview: async () => {
    const { data } = await api.get("/owner/api-gateway/overview")
    return data
  },
  
  getUsageTrends: async () => {
    const { data } = await api.get("/owner/api-gateway/usage-trends")
    return data
  },
  
  getErrors: async () => {
    const { data } = await api.get("/owner/api-gateway/errors")
    return data
  },
  
  getLiveRequests: async (limit = 20) => {
    const { data } = await api.get(`/owner/api-gateway/live-requests?limit=${limit}`)
    return data
  },
  
  getKeys: async () => {
    const { data } = await api.get("/owner/api-gateway/keys")
    return data
  },
  
  getOAuthClients: async () => {
    const { data } = await api.get("/owner/api-gateway/oauth-clients")
    return data
  },
  
  getIntegrations: async () => {
    const { data } = await api.get("/owner/api-gateway/integrations")
    return data
  },
  
  getSecurityOverview: async () => {
    const { data } = await api.get("/owner/api-gateway/security")
    return data
  }
}
