"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Plus, Sparkles, Filter, MoreHorizontal, ArrowRight, Activity, Database, BarChart3, Clock, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { AIDashboardGenerateModal } from "@/components/organisms/AIDashboardGenerateModal"

export function DashboardBuilderHub({ basePath }: { basePath: string }) {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dashboardToDelete, setDashboardToDelete] = useState<any | null>(null)

  useEffect(() => {
    fetchDashboards()
  }, [])

  const fetchDashboards = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/tenant-dashboards')
      setDashboards(res.data)
    } catch (error) {
      console.error("Failed to fetch dashboards", error)
      toast.error("Failed to load dashboards")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = async () => {
    try {
      const res = await api.post('/tenant-dashboards', {
        name: "Untitled Dashboard",
        description: "New dashboard created from builder",
        layout_json: { widgets: [] }
      })
      router.push(`${basePath}/${res.data.id}`)
    } catch (error) {
      toast.error("Failed to create dashboard")
    }
  }

  const handleAIGenerate = () => {
    setIsAiModalOpen(true)
  }

  const handleDeleteDashboard = async (id: string) => {
    try {
      await api.delete(`/tenant-dashboards/${id}`)
      toast.success("Dashboard deleted successfully")
      fetchDashboards()
    } catch (error) {
      toast.error("Failed to delete dashboard")
    }
    setDashboardToDelete(null)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = () => setOpenDropdownId(null)
    window.addEventListener('click', closeDropdown)
    return () => window.removeEventListener('click', closeDropdown)
  }, [])

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-white/5 p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Dashboard Builder
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Create, manage, and deploy interactive BI dashboards for your organization.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleAIGenerate}
            className="flex items-center px-4 py-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:-translate-y-0.5 transition-all shadow-sm border border-emerald-200 dark:border-emerald-500/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </button>
          <button 
            onClick={handleCreateNew}
            className="flex items-center px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 hover:-translate-y-0.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Dashboard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{dashboards.length}</h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Dashboards</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
            {dashboards.reduce((acc, d) => acc + (d.view_count || 0), 0)}
          </h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Views</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-amber-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Active</h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Data Connections</p>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center border-dashed border-2 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:border-emerald-500 hover:shadow-emerald-500/10 hover:shadow-lg hover:-translate-y-1 transition-all group" onClick={handleCreateNew}>
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="p-4 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-full relative z-10 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Blank Canvas</p>
        </div>
      </div>

      {/* Dashboard List */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Dashboards</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      ) : dashboards.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No dashboards yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Create your first dashboard from scratch or let our AI Copilot generate one for you based on your datasets.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={handleCreateNew} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors">
              Create Blank Dashboard
            </button>
            <button onClick={handleAIGenerate} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Use Templates
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={dashboard.id} 
              onClick={() => router.push(`${basePath}/${dashboard.id}`)}
              className="bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col overflow-hidden"
            >
              {/* Decorative top pattern */}
              <div className="h-2 w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:8px_8px] border-b border-slate-100 dark:border-white/5 opacity-50 group-hover:bg-[radial-gradient(#10b98122_1px,transparent_1px)] transition-colors"></div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/20 transition-colors">
                      <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base leading-tight mb-1">
                        {dashboard.name}
                      </h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${dashboard.is_published ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}>
                        {dashboard.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdownId(openDropdownId === dashboard.id ? null : dashboard.id)
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openDropdownId === dashboard.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-20">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setDashboardToDelete(dashboard)
                            setOpenDropdownId(null)
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          Delete Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 flex-1">
                  {dashboard.description || "No description provided."}
                </p>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-white/5 pt-4 mt-auto">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}
                  </div>
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
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
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
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
