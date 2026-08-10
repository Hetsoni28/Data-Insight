"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DndContext, DragEndEvent, pointerWithin } from "@dnd-kit/core"
import { ArrowLeft, Save, Play, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useBuilderStore, DashboardWidget } from "@/store/useBuilderStore"

import { DashboardBuilderSidebar } from "@/components/organisms/DashboardBuilderSidebar"
import { DashboardBuilderCanvas } from "@/components/organisms/DashboardBuilderCanvas"
import { DashboardBuilderProperties } from "@/components/organisms/DashboardBuilderProperties"

export default function DashboardBuilderWorkspace() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { layout, isDirty, setLayout, addWidget, setSelectedWidgetId } = useBuilderStore()
  
  const [dashboard, setDashboard] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (id) {
      loadDashboard()
    }
  }, [id])

  const loadDashboard = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/tenant-dashboards/${id}`)
      setDashboard(res.data)
      setLayout(res.data.layout_json || { widgets: [] })
    } catch (error) {
      toast.error("Failed to load dashboard")
      router.push('/organization-admin/dashboard/builder')
    } finally {
      setIsLoading(false)
    }
  }

  const saveDashboard = async () => {
    try {
      setIsSaving(true)
      await api.patch(`/tenant-dashboards/${id}`, {
        layout_json: layout
      })
      toast.success("Dashboard saved successfully")
      // Reset isDirty
      setLayout(layout)
    } catch (error) {
      toast.error("Failed to save dashboard")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      const newStatus = !dashboard?.is_published
      await api.patch(`/tenant-dashboards/${id}`, {
        is_published: newStatus
      })
      setDashboard({ ...dashboard, is_published: newStatus })
      toast.success(newStatus ? "Dashboard published successfully" : "Dashboard unpublished")
    } catch (error) {
      toast.error("Failed to update publish status")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && over.id === 'canvas-droppable') {
      if (active.data.current?.isTemplate) {
        // Create new widget
        const newWidget: DashboardWidget = {
          id: uuidv4(),
          type: active.data.current.type,
          title: active.data.current.title,
          x: 0,
          y: 0,
          w: 4, // default width
          h: 3, // default height
          config: {}
        }
        addWidget(newWidget)
        setSelectedWidgetId(newWidget.id)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0B0F17]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-[#0B0F17] overflow-hidden">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B0F17] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/organization-admin/dashboard/builder')}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {dashboard?.name || 'Untitled Dashboard'}
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight flex items-center mt-0.5">
              {isDirty ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span> Unsaved changes</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> All changes saved</>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isPreviewMode ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Play className={`w-4 h-4 mr-1.5 ${isPreviewMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>
          
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${dashboard?.is_published ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <ExternalLink className={`w-4 h-4 mr-1.5 ${dashboard?.is_published ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            {isPublishing ? 'Updating...' : (dashboard?.is_published ? 'Unpublish' : 'Publish')}
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
          <button 
            onClick={saveDashboard}
            disabled={!isDirty || isSaving}
            className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isDirty && !isSaving 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm' 
                : 'bg-emerald-500/50 text-white/70 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
          {!isPreviewMode && <DashboardBuilderSidebar />}
          <DashboardBuilderCanvas isPreviewMode={isPreviewMode} />
        </DndContext>
        {!isPreviewMode && <DashboardBuilderProperties />}
      </div>
    </div>
  )
}
