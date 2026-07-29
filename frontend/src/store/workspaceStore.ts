import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Workspace } from '@/types'

interface WorkspaceState {
  workspaces: Workspace[]
  activeWs: Workspace | null
  loadingWs: boolean
  isUploadOpen: boolean
  
  setWorkspaces: (workspaces: Workspace[]) => void
  setActiveWs: (ws: Workspace | null) => void
  setLoadingWs: (loading: boolean) => void
  setIsUploadOpen: (isOpen: boolean) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWs: null,
      loadingWs: true,
      isUploadOpen: false,
      
      setWorkspaces: (workspaces) => set({ workspaces }),
      setActiveWs: (activeWs) => set({ activeWs }),
      setLoadingWs: (loadingWs) => set({ loadingWs }),
      setIsUploadOpen: (isUploadOpen) => set({ isUploadOpen }),
    }),
    {
      name: 'workspace-storage-v1',
      // Only persist the active workspace selection, not loading state
      partialize: (state) => ({
        activeWs: state.activeWs,
        workspaces: state.workspaces,
      }),
    }
  )
)
