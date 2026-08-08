"use client"
import { Plus, ChevronsUpDown, Check, X, Loader2 } from "lucide-react"
import type { Workspace } from "@/types"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import api from "@/lib/api"
import { useWorkspaceStore } from "@/store/workspaceStore"

interface WorkspacePickerProps {
  workspaces: Workspace[]
  activeWs: Workspace | null
  loadingWs: boolean
  isCollapsed?: boolean
}

export function WorkspacePicker({ workspaces, activeWs, loadingWs, isCollapsed = false }: WorkspacePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWsName, setNewWsName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  const { setWorkspaces, setActiveWs } = useWorkspaceStore()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Only render portal on client side
  useEffect(() => { setMounted(true) }, [])

  // Recompute dropdown position whenever it opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      })
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on scroll / resize
  useEffect(() => {
    if (!isOpen) return
    const close = () => setIsOpen(false)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [isOpen])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWsName.trim()) return
    setIsCreating(true)
    try {
      const res = await api.post("/workspaces", { name: newWsName, icon: "📊" })
      const newWs = res.data
      setWorkspaces([...workspaces, newWs])
      setActiveWs(newWs)
      setShowCreateModal(false)
      setNewWsName("")
      setIsOpen(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectWorkspace = (ws: Workspace) => {
    setActiveWs(ws)
    setIsOpen(false)
    window.location.reload()
  }

  if (loadingWs) {
    return <div className={`w-full h-12 rounded-xl bg-white/5 animate-pulse border border-white/10 ${isCollapsed ? 'h-10 w-10 mx-auto' : ''}`} />
  }

  const dropdown = isOpen && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: isCollapsed ? 224 : dropdownPos.width,
        zIndex: 9999,
      }}
      className="bg-[#0d1618] border border-white/10 rounded-xl shadow-2xl overflow-hidden shadow-black/60 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="px-2 py-2">
        <div className="px-2 pb-2 text-[10px] font-bold text-emerald-100/50 uppercase tracking-widest">
          Switch Workspace
        </div>
        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelectWorkspace(ws)}
              className={`flex items-center justify-between w-full text-left px-2 py-2 text-sm rounded-lg transition-colors ${
                activeWs?.id === ws.id
                  ? 'bg-emerald-500/10 text-emerald-100'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 h-5 flex items-center justify-center bg-white/5 rounded font-emoji text-xs">{ws.icon}</span>
                <span className="truncate">{ws.name}</span>
              </div>
              {activeWs?.id === ws.id && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            </button>
          ))}
        </div>

        <div className="h-px bg-white/10 my-2" />

        <button
          onClick={() => {
            setIsOpen(false)
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 w-full text-left px-2 py-2 text-sm rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create new workspace
        </button>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div className="relative w-full">
      {workspaces.length === 0 ? (
        <button
          onClick={() => setShowCreateModal(true)}
          title={isCollapsed ? "Create workspace" : undefined}
          className={`flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-white bg-emerald-500/20 hover:bg-emerald-500/30 transition-all border border-emerald-400/30 shadow-sm ${
            isCollapsed ? 'w-10 h-10 mx-auto' : 'w-full px-3 py-3'
          }`}
        >
          <Plus className="h-4 w-4" /> {!isCollapsed && "Create workspace"}
        </button>
      ) : (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          title={isCollapsed ? activeWs?.name : undefined}
          className={`w-full flex items-center justify-between rounded-xl hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group shadow-sm bg-white/5 backdrop-blur-sm ${
            isCollapsed ? 'p-1.5 justify-center' : 'px-3 py-3'
          } ${isOpen ? 'border-white/20 bg-white/10' : ''}`}
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
            <ChevronsUpDown className={`h-4 w-4 flex-shrink-0 transition-all ${isOpen ? 'text-emerald-300 rotate-180' : 'text-emerald-200/50 group-hover:text-emerald-100'}`} />
          )}
        </button>
      )}

      {/* Portal-based dropdown — renders at document.body, escapes all clipping contexts */}
      {dropdown}

      {/* Create Workspace Modal */}
      {showCreateModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f1b1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Create Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="wsName" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    id="wsName"
                    type="text"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="e.g. Marketing Team"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newWsName.trim() || isCreating}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-emerald-600 flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
