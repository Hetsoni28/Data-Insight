"use client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, Upload, Search, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useWorkspaceStore } from "@/store/workspaceStore"
import { toast } from "sonner"
import React from "react"

export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { activeWs, loadingWs } = useWorkspaceStore()

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean)
    
    // Always start with the workspace name if loaded, otherwise Dashboard
    const isOwner = pathname.startsWith("/owner")
    const breadcrumbs = [
      { label: isOwner ? "Platform Administration" : (activeWs?.name || "Workspace"), isLast: paths.length <= 1 }
    ]
    
    // Add the specific page if we are deep
    if (paths.length > 1) {
      const segment = paths[paths.length - 1]
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        isLast: true
      })
      breadcrumbs[0].isLast = false
    }
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  const handleUploadClick = () => {
    if (loadingWs) {
      toast.info("Loading workspace, please try again in a moment.")
      return
    }
    if (!activeWs) {
      toast.error("No workspace found. Redirecting to setup...")
      router.push("/onboarding")
      return
    }
    if (onUploadClick) {
      onUploadClick()
    } else {
      router.push("/owner/dashboard/datasets")
    }
  }

  return (
    <header className="sticky top-0 z-10 bg-white/60 backdrop-blur-2xl border-b border-slate-200/60 px-8 py-3.5 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      
      {/* Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-medium">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
            {crumb.isLast ? (
              <span className="text-slate-900 font-semibold">{crumb.label}</span>
            ) : (
              <Link href="/owner/dashboard" className="text-slate-500 hover:text-slate-700 transition-colors">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Command Palette Search Trigger */}
        <button onClick={() => toast.info("Global Command Palette (⌘K) is opening...")} className="relative hidden md:flex items-center w-64 h-9 pl-3 pr-2 bg-slate-100/50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 rounded-xl transition-all group">
          <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-500 transition-colors mr-2" />
          <span className="text-[13px] text-slate-400 group-hover:text-slate-500 font-medium">Search...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-sm">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-sm">K</kbd>
          </div>
        </button>



        {/* Notifications */}
        <button suppressHydrationWarning className="p-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-all relative group">
          <Bell className="h-4 w-4 group-hover:animate-pulse" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Quick Create / Upload */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
          <Button
            suppressHydrationWarning
            onClick={handleUploadClick}
            disabled={loadingWs}
            className="relative h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm border-t border-emerald-400 rounded-xl font-medium text-[13px] gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingWs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload Dataset
          </Button>
        </div>
      </div>
    </header>
  )
}
