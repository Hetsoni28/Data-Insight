import api from '@/lib/api'

export interface StructuredQuery {
  dimension?: string
  metric?: string
  aggregation?: string
  limit?: number
  sort?: { column: string; direction: string }[]
}

export const DashboardQueryService = {
  async executeQuery(datasetId: string, query: StructuredQuery): Promise<any> {
    const res = await api.post(`/datasets/${datasetId}/query/structured`, {
      dataset_id: datasetId,
      ...query
    })
    return res.data
  }
}
