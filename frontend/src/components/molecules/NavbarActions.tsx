import { useRouter } from "next/navigation"
import { Search, Bell, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/molecules/ThemeToggle"

interface NavbarActionsProps {
  onSearchClick: () => void
  onUploadClick?: () => void
  showUploadButton?: boolean
}

export function NavbarActions({ onSearchClick, onUploadClick, showUploadButton = true }: NavbarActionsProps) {
  const router = useRouter()
  const { activeWs, loadingWs } = useWorkspaceStore()

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
    <div className="flex items-center gap-4">
      {/* Command Palette Search Trigger */}
      <button onClick={onSearchClick} className="relative hidden md:flex items-center w-64 h-9 pl-3 pr-2 bg-slate-100/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 rounded-xl transition-all group">
        <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors mr-2" />
        <span className="text-[13px] text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 font-medium">Search...</span>
        <div className="ml-auto flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-sm">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-sm">K</kbd>
        </div>
      </button>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Notifications */}
      <button suppressHydrationWarning onClick={() => router.push('/owner/dashboard/notifications')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/20 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-all relative group">
        <Bell className="h-4 w-4 group-hover:animate-pulse" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-background" />
      </button>

      {/* Quick Create / Upload */}
      {showUploadButton && (
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
      )}
    </div>
  )
}
