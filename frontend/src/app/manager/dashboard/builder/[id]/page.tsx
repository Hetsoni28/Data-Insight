import dynamic from "next/dynamic"


"use client"


const DashboardBuilderWorkspace = dynamic(() => import('@/components/organisms/DashboardBuilderWorkspace').then(m => m.DashboardBuilderWorkspace), { ssr: false })

export default function ManagerDashboardBuilderWorkspacePage() {
  return <DashboardBuilderWorkspace basePath="/manager/dashboard/builder" />
}
