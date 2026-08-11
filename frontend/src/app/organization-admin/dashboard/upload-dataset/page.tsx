import { DatasetIngestionWorkspace } from "@/components/organisms/dataset-ingestion/DatasetIngestionWorkspace"

export const metadata = {
  title: "Upload Dataset | Data Insight",
  description: "Ingest and profile data for AI analysis.",
}

export default function OrgAdminUploadDatasetPage() {
  return <DatasetIngestionWorkspace role="org_admin" />
}
