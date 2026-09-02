"use client"
import dynamic from "next/dynamic"



const AnalystBuilderHub = dynamic(() => import('@/components/organisms/AnalystBuilderHub').then(m => m.AnalystBuilderHub), { ssr: false })

export default function DashboardBuilderHubPage() {
  return <AnalystBuilderHub />
}
