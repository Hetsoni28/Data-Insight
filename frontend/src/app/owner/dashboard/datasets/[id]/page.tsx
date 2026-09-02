import dynamic from "next/dynamic"

const DatasetDetailExplorer = dynamic(() => import('@/components/organisms/DatasetDetailExplorer').then(m => m.DatasetDetailExplorer), { ssr: false })

"use client"


export default function OwnerDatasetDetailPage() {
  return <DatasetDetailExplorer backHref="/owner/dashboard/datasets" backLabel="Back to Dataset Management" />
}
