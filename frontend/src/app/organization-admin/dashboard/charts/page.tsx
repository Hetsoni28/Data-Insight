import React from "react"
import { AnalystChartsShell } from "@/components/organisms/AnalystChartsShell"

export const metadata = {
  title: "Charts - Data Insight",
  description: "Create, explore, and manage visualizations from your authorized data."
}

export default function AnalystChartsPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AnalystChartsShell />
    </div>
  )
}
