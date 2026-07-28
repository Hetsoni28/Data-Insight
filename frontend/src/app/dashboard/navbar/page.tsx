"use client"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Upload, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useWorkspaceStore } from "@/store/workspaceStore"
import { toast } from "sonner"

export default function Navbar({ onUploadClick }: { onUploadClick?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { activeWs } = useWorkspaceStore()

  // Format a clean title from the pathname
  const formatTitle = () => {
    if (pathname === "/dashboard") return "Overview"
    const segment = pathname.split("/").pop()
    if (!segment) return "Overview"
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  const handleUploadClick = () => {
    if (!activeWs) {
      toast.error("Please create a workspace first before uploading datasets.")
      router.push("/onboarding")
      return
    }
    if (onUploadClick) {
      onUploadClick()
    } else {
      router.push("/dashboard/datasets")
    }
  }

  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{formatTitle()}</h1>
        <p className="text-[13px] text-slate-500 mt-1 font-medium" suppressHydrationWarning>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            suppressHydrationWarning
            className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[13px] outline-none focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Notifications */}
        <button suppressHydrationWarning className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/60 text-slate-400 hover:text-slate-600 transition-all relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Upload Button */}
        <Button
          suppressHydrationWarning
          onClick={handleUploadClick}
          className="h-9 px-4 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-sm shadow-emerald-500/20 border-t border-emerald-400 rounded-xl font-medium text-[13px] gap-2 transition-all"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Dataset
        </Button>
      </div>
    </header>
  )
}
