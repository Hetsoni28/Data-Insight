import dynamic from "next/dynamic"

const DatasetIngestionWorkspace = dynamic(() => import('@/components/organisms/dataset-ingestion/DatasetIngestionWorkspace').then(m => m.DatasetIngestionWorkspace), { ssr: false })


export const metadata = {
  title: "Upload Dataset",
  description: "Ingest and profile data for AI analysis.",
}

export default function AnalystUploadDatasetPage() {
  return <DatasetIngestionWorkspace role="analyst" />
}
