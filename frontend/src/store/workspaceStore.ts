import { create } from 'zustand'
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

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWs: null,
  loadingWs: true,
  isUploadOpen: false,
  
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWs: (activeWs) => set({ activeWs }),
  setLoadingWs: (loadingWs) => set({ loadingWs }),
  setIsUploadOpen: (isUploadOpen) => set({ isUploadOpen }),
}))
