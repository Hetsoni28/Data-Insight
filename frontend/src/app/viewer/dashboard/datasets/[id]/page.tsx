import dynamic from "next/dynamic"


"use client"


const DatasetDetailExplorer = dynamic(() => import('@/components/organisms/DatasetDetailExplorer').then(m => m.DatasetDetailExplorer), { ssr: false })

export default function ViewerDatasetDetailPage() {
  return <DatasetDetailExplorer backHref="/viewer/dashboard/datasets" backLabel="Back to Datasets" />
}
