"use client"
import dynamic from "next/dynamic"



const ViewerDatasetExplorer = dynamic(() => import('@/components/organisms/ViewerDatasetExplorer').then(m => m.ViewerDatasetExplorer), { ssr: false })

export default function DatasetsPage() {
  return <ViewerDatasetExplorer />
}
