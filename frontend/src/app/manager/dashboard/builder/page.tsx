import dynamic from "next/dynamic"

const DashboardBuilderHub = dynamic(() => import('@/components/organisms/DashboardBuilderHub').then(m => m.DashboardBuilderHub), { ssr: false })

"use client"


export default function ManagerDashboardBuilderPage() {
  return <DashboardBuilderHub basePath="/manager/dashboard/builder" />
}
