"use client"
import dynamic from "next/dynamic"



const DatasetIngestionWorkspace = dynamic(() => import('@/components/organisms/dataset-ingestion/DatasetIngestionWorkspace').then(m => m.DatasetIngestionWorkspace), { ssr: false })

export default function AnalystUploadDatasetPage() {
  return <DatasetIngestionWorkspace role="owner" />
}
