"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Plus, Sparkles, Filter, MoreHorizontal, ArrowRight, Activity, Database, BarChart3, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function DashboardBuilderHubPage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      router.push(`/organization-admin/dashboard/builder/${res.data.id}`)
    } catch (error) {
      toast.error("Failed to create dashboard")
    }
  }

  const handleAIGenerate = () => {
    // We can show a modal for this later, for now just jump to a new one with AI prompt
    toast.info("AI Copilot modal coming soon!")
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Dashboard Builder
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Create, manage, and deploy interactive BI dashboards for your organization.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleAIGenerate}
            className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </button>
          <button 
            onClick={handleCreateNew}
            className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Dashboard
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <LayoutDashboard className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{dashboards.length}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Dashboards</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {dashboards.reduce((acc, d) => acc + (d.view_count || 0), 0)}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Views</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <Database className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Active</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Connections</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={handleCreateNew}>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-full mb-3">
            <Plus className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Blank Canvas</p>
        </div>
      </div>

      {/* Dashboard List */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Dashboards</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 h-48 animate-pulse"></div>
          ))}
        </div>
      ) : dashboards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
            <button onClick={handleAIGenerate} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
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
              onClick={() => router.push(`/organization-admin/dashboard/builder/${dashboard.id}`)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                    <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {dashboard.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${dashboard.is_published ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                      {dashboard.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                {dashboard.description || "No description provided."}
              </p>
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })}
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Builder <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
