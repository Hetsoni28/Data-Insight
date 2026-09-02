import dynamic from "next/dynamic"

const DashboardBuilderWorkspace = dynamic(() => import('@/components/organisms/DashboardBuilderWorkspace').then(m => m.DashboardBuilderWorkspace), { ssr: false })

"use client"


export default function ManagerDashboardBuilderWorkspacePage() {
  return <DashboardBuilderWorkspace basePath="/manager/dashboard/builder" />
}
