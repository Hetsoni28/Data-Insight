import dynamic from "next/dynamic"

const AnalystBuilderHub = dynamic(() => import('@/components/organisms/AnalystBuilderHub').then(m => m.AnalystBuilderHub), { ssr: false })


export const metadata = {
  title: "Dashboard Builder",
}

export default function DashboardBuilderHubPage() {
  return <AnalystBuilderHub />
}
