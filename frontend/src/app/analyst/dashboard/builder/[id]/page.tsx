"use client"
import dynamic from "next/dynamic"



const AnalystBuilderShell = dynamic(() => import('@/components/organisms/AnalystBuilderShell').then(m => m.AnalystBuilderShell), { ssr: false })

export default function DashboardBuilderWorkspacePage() {
  return <AnalystBuilderShell />
}
