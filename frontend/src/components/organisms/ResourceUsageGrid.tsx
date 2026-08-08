import { UsageMeterCard } from "@/components/molecules/UsageMeterCard"
import { Users, Database, Sparkles, FolderOpen, FileBarChart, LayoutDashboard } from "lucide-react"

export interface UsageMeterData {
  used: number
  limit: number | null
  pct: number
  remaining: number | null
  warningState: "normal" | "warning" | "high" | "critical" | "limit"
}

export interface ResourceUsageMap {
  members: UsageMeterData
  storage: UsageMeterData
  aiTokens: UsageMeterData
  datasets: UsageMeterData
  reports: UsageMeterData
  dashboards: UsageMeterData
}

interface ResourceUsageGridProps {
  usage: ResourceUsageMap
}

export function ResourceUsageGrid({ usage }: ResourceUsageGridProps) {
  const meters = [
    {
      key: "members",
      title: "Team Members",
      icon: Users,
      data: usage.members
    },
    {
      key: "storage",
      title: "Storage (GB)",
      icon: Database,
      data: usage.storage
    },
    {
      key: "aiTokens",
      title: "AI Tokens",
      icon: Sparkles,
      data: usage.aiTokens
    },
    {
      key: "datasets",
      title: "Datasets",
      icon: FolderOpen,
      data: usage.datasets
    },
    {
      key: "dashboards",
      title: "Dashboards",
      icon: LayoutDashboard,
      data: usage.dashboards
    },
    {
      key: "reports",
      title: "Reports",
      icon: FileBarChart,
      data: usage.reports
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {meters.map(meter => (
        <UsageMeterCard
          key={meter.key}
          title={meter.title}
          icon={meter.icon}
          used={meter.data.used}
          limit={meter.data.limit}
          pct={meter.data.pct}
          warningState={meter.data.warningState}
        />
      ))}
    </div>
  )
}
