"use client"
import { motion } from "framer-motion"
import { Upload, FileSpreadsheet, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

import { StateLayout } from "@/components/molecules/StateLayout"
import { DashboardBuilderIllustration } from "@/components/molecules/DashboardBuilderIllustration"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function DashboardEmptyState({ onUploadClick }: { onUploadClick?: () => void }) {
  const { activeWs, loadingWs } = useWorkspaceStore()
  const router = useRouter()

  const handleUploadClick = () => {
    if (loadingWs) {
      toast.info("Loading workspace, please wait a moment.")
      return
    }
    if (!activeWs) {
      toast.error("No workspace found. Redirecting to setup...")
      router.push("/onboarding")
      return
    }
    onUploadClick?.()
  }

  const handleSampleReportClick = () => {
    if (loadingWs) return
    if (!activeWs) {
      toast.error("Please create a workspace first to view reports.")
      router.push("/onboarding")
      return
    }
    toast.success("Sample report generated!")
    // In the future this might route to a demo report page
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden min-h-[400px]">
      <StateLayout
        illustration={<DashboardBuilderIllustration />}
        headline="Let's bring your data to life"
        description="Upload a CSV, XLSX, or JSON file and our AI will automatically profile it, find hidden insights, and generate a board-ready report in seconds."
        primaryAction={{
          label: "Upload first dataset",
          icon: <Upload className="w-4 h-4" />,
          onClick: handleUploadClick,
        }}
        secondaryAction={{
          label: "View sample report",
          icon: <FileSpreadsheet className="w-4 h-4" />,
          onClick: handleSampleReportClick,
        }}
        aiSuggestion="AI analyzes your datasets to instantly generate actionable insights."
      />
    </div>
  )
}
