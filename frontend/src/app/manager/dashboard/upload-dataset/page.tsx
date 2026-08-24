import { DatasetIngestionWorkspace } from "@/components/organisms/dataset-ingestion/DatasetIngestionWorkspace"

export const metadata = {
  title: "Upload Dataset",
  description: "Ingest and profile data for AI analysis.",
}

export default function AnalystUploadDatasetPage() {
  return <DatasetIngestionWorkspace role="manager" />
}
