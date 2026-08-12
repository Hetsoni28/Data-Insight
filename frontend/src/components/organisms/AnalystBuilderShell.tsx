"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import { DndContext, DragEndEvent, pointerWithin } from "@dnd-kit/core"
import { ArrowLeft, Save, Play, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

import { DashboardService } from "@/lib/services/dashboard.service"
import { useAuthStore } from "@/store/authStore"
import { useBuilderStore, DashboardWidget } from "@/store/useBuilderStore"

import { AnalystBuilderSidebar } from "./AnalystBuilderSidebar"
import { AnalystBuilderCanvas } from "./AnalystBuilderCanvas"
import { AnalystBuilderProperties } from "./AnalystBuilderProperties"

export function AnalystBuilderShell() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const id = params.id as string
  const { layout, isDirty, setLayout, addWidget, setSelectedWidgetId } = useBuilderStore()
  
  const [dashboard, setDashboard] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else if (pathname.includes("/organization-admin")) {
      router.push("/organization-admin/dashboard/builder")
    } else {
      router.push("/analyst/dashboard/builder")
    }
  }

  useEffect(() => {
    if (id) {
      loadDashboard()
    }
  }, [id])

  const loadDashboard = async () => {
    try {
      setIsLoading(true)
      const data = await DashboardService.getDashboard(id)
      setDashboard(data)
      setLayout({ widgets: data.layout_json?.widgets || [] })
    } catch (error) {
      console.error("Failed to load dashboard", error)
      toast.error("Failed to load dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await DashboardService.updateDashboard(id, { layout_json: { widgets: layout.widgets } })
      toast.success("Dashboard saved")
      
      // Reset dirty state
      setLayout({ widgets: layout.widgets })
    } catch (error) {
      console.error("Failed to save dashboard", error)
      toast.error("Failed to save dashboard")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)
      await DashboardService.updateDashboard(id, { is_published: !dashboard?.is_published })
      toast.success(dashboard?.is_published ? "Dashboard unpublished" : "Dashboard published successfully")
      loadDashboard() // reload to get updated state
    } catch (error) {
      console.error("Failed to publish dashboard", error)
      toast.error("Failed to change publish status")
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
    <div className="absolute inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-2xl flex items-center justify-between px-5 shrink-0 z-20 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={handleBack}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            title="Back to Dashboard Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              {dashboard?.name || 'Untitled Dashboard'}
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 leading-tight flex items-center mt-0.5">
              {isDirty ? (
                <span className="flex items-center text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" /> Unsaved changes
                </span>
              ) : (
                <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" /> All changes saved
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              isPreviewMode 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <Play className={`w-3.5 h-3.5 mr-1.5 ${isPreviewMode ? 'fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400' : 'text-slate-400'}`} />
            {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>
          
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className={`flex items-center px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
              dashboard?.is_published 
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ExternalLink className={`w-3.5 h-3.5 mr-1.5 ${dashboard?.is_published ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            {isPublishing ? 'Updating...' : (dashboard?.is_published ? 'Unpublish' : 'Publish')}
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button 
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {isSaving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
          {!isPreviewMode && <AnalystBuilderSidebar />}
          <AnalystBuilderCanvas isPreviewMode={isPreviewMode} />
        </DndContext>
        {!isPreviewMode && <AnalystBuilderProperties />}
      </div>
    </div>
  )
}
