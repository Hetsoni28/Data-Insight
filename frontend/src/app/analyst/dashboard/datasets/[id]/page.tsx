"use client"
import dynamic from "next/dynamic"




const DatasetDetailExplorer = dynamic(() => import('@/components/organisms/DatasetDetailExplorer').then(m => m.DatasetDetailExplorer), { ssr: false })

export default function DatasetDetailPage() {
  return <DatasetDetailExplorer backHref="/analyst/dashboard/datasets" backLabel="Back to Datasets" />
}
