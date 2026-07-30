import { Plus, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Workspace } from "@/types"
import { useState } from "react"

interface WorkspacePickerProps {
  workspaces: Workspace[]
  activeWs: Workspace | null
  loadingWs: boolean
  isCollapsed?: boolean
}

export function WorkspacePicker({ workspaces, activeWs, loadingWs, isCollapsed = false }: WorkspacePickerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (loadingWs) {
    return <div className={`w-full h-12 rounded-xl bg-white/5 animate-pulse border border-white/10 ${isCollapsed ? 'h-10 w-10 mx-auto' : ''}`} />
  }

  if (workspaces.length === 0) {
    return (
      <button
        onClick={() => router.push("/onboarding")}
        title={isCollapsed ? "Create workspace" : undefined}
        className={`flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white bg-emerald-500/20 hover:bg-emerald-500/30 transition-all border border-emerald-400/30 shadow-sm ${
          isCollapsed ? 'w-10 h-10 mx-auto' : 'w-full px-3 py-3'
        }`}
      >
        <Plus className="h-4 w-4" /> {!isCollapsed && "Create workspace"}
      </button>
    )
  }

  return (
    <button 
      onClick={() => setIsOpen(!isOpen)}
      title={isCollapsed ? activeWs?.name : undefined}
      className={`w-full flex items-center justify-between rounded-xl hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group shadow-sm bg-white/5 backdrop-blur-sm ${
        isCollapsed ? 'p-1.5 justify-center' : 'px-3 py-3'
      }`}
    >
      <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
        <span className="text-xl bg-[#082f22] text-white rounded-lg shadow-inner w-8 h-8 flex items-center justify-center border border-white/10 flex-shrink-0 font-emoji">
          {activeWs?.icon ?? "📊"}
        </span>
        {!isCollapsed && (
          <div className="flex flex-col items-start truncate">
            <span className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-[0.15em] mb-0.5">Workspace</span>
            <span className="text-[14px] font-bold text-white tracking-wide truncate">{activeWs?.name}</span>
          </div>
        )}
      </div>
      {!isCollapsed && (
        <ChevronsUpDown className="h-4 w-4 text-emerald-200/50 group-hover:text-emerald-100 flex-shrink-0 transition-colors" />
      )}
    </button>
  )
}
