import dynamic from "next/dynamic"


"use client"


const DatasetDetailExplorer = dynamic(() => import('@/components/organisms/DatasetDetailExplorer').then(m => m.DatasetDetailExplorer), { ssr: false })

export default function OwnerDatasetDetailPage() {
  return <DatasetDetailExplorer backHref="/owner/dashboard/datasets" backLabel="Back to Dataset Management" />
}
