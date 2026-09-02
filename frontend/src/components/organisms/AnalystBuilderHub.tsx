"use client"

import React, { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, Plus, Sparkles, Filter, MoreHorizontal, ArrowRight, Activity, Database, BarChart3, Clock, AlertTriangle, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DashboardService } from "@/lib/services/dashboard.service"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { AIDashboardGenerateModal } from "@/components/organisms/AIDashboardGenerateModal"
import { useWorkspaceStore } from "@/store/workspaceStore"

export function AnalystBuilderHub() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dashboardToDelete, setDashboardToDelete] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const getBuilderPath = (id: string) => {
    const roleMatch = pathname.match(/^\/(owner|organization-admin|manager|analyst)/);
    const basePath = roleMatch ? roleMatch[0] : '/analyst';
    return `${basePath}/dashboard/builder/${id}`
  }

  const activeWs = useWorkspaceStore((state: any) => state.activeWs)

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ['dashboards', activeWs?.id],
    queryFn: () => DashboardService.getDashboards()
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => DashboardService.createDashboard(data),
    onSuccess: (newDashboard) => {
      router.push(getBuilderPath(newDashboard.id))
    },
    onError: () => {
      toast.error("Failed to create dashboard")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DashboardService.deleteDashboard(id),
    onSuccess: () => {
      toast.success("Dashboard deleted successfully")
      queryClient.invalidateQueries({ queryKey: ['dashboards'] })
    },
    onError: () => {
      toast.error("Failed to delete dashboard")
    }
  })

  const handleCreateNew = () => {
    createMutation.mutate({
      name: "Untitled Dashboard",
      description: "New dashboard created from builder"
    })
  }

  const handleAIGenerate = () => {
    setIsAiModalOpen(true)
  }

  const handleDeleteDashboard = (id: string) => {
    deleteMutation.mutate(id)
    setDashboardToDelete(null)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = () => setOpenDropdownId(null)
    window.addEventListener('click', closeDropdown)
    return () => window.removeEventListener('click', closeDropdown)
  }, [])

  const filteredDashboards = dashboards.filter((d: any) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const publishedCount = dashboards.filter((d: any) => d.is_published).length

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10 select-none custom-scrollbar">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> BI Studio
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {dashboards.length} Total Dashboards ({publishedCount} Published)
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard Builder
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Build interactive real-time BI dashboards or generate full layouts using AI.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={handleAIGenerate}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-300 rounded-2xl font-bold hover:from-emerald-500/20 hover:to-teal-500/20 transition-all border border-emerald-500/30 shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2 text-emerald-500 animate-pulse" />
            Generate with AI
          </button>
          <button 
            onClick={handleCreateNew}
            disabled={createMutation.isPending}
            className="flex items-center px-5 py-2.5 bg-emerald-500 text-white rounded-2xl font-extrabold hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Blank
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Your Dashboards
        </h2>
        {dashboards.length > 0 && (
          <div className="relative w-64 max-w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search dashboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none text-slate-900 dark:text-white transition-all"
            />
          </div>
        )}
      </div>

      {/* Dashboard List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 h-52 animate-pulse" />
          ))}
        </div>
      ) : filteredDashboards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm backdrop-blur-xl max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Dashboards Found</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {searchQuery ? "No dashboards match your search criteria." : "Create your first dashboard from scratch or let our AI Copilot build one instantly for your datasets."}
          </p>
          <div className="flex justify-center space-x-3">
            <button onClick={handleCreateNew} disabled={createMutation.isPending} className="px-5 py-2.5 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">
              Create Blank Dashboard
            </button>
            <button onClick={handleAIGenerate} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              key={dashboard.id} 
              onClick={() => router.push(getBuilderPath(dashboard.id))}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden relative"
            >
              {/* Card Header Pattern */}
              <div className="h-2.5 w-full bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-indigo-500/20 border-b border-slate-100 dark:border-slate-800/80" />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/20 transition-all shrink-0">
                      <LayoutDashboard className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base leading-tight mb-1 truncate">
                        {dashboard.name}
                      </h3>
                      <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${dashboard.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}>
                        {dashboard.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdownId(openDropdownId === dashboard.id ? null : dashboard.id)
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openDropdownId === dashboard.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-30">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setDashboardToDelete(dashboard)
                            setOpenDropdownId(null)
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          Delete Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 leading-relaxed flex-1">
                  {dashboard.description || "No description provided."}
                </p>

                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-auto">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}
                  </div>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-extrabold text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                    Open Builder <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* The AI Generation Modal */}
      <AIDashboardGenerateModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
      />

      {/* Delete Confirmation Modal */}
      {dashboardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Dashboard</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">&quot;{dashboardToDelete.name}&quot;</span>? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <button 
                  onClick={() => setDashboardToDelete(null)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteDashboard(dashboardToDelete.id)}
                  className="px-4 py-2 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
