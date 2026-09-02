import dynamic from "next/dynamic"


"use client"


const DashboardBuilderHub = dynamic(() => import('@/components/organisms/DashboardBuilderHub').then(m => m.DashboardBuilderHub), { ssr: false })

export default function ManagerDashboardBuilderPage() {
  return <DashboardBuilderHub basePath="/manager/dashboard/builder" />
}
