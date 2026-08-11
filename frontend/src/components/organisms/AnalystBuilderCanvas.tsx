"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { useDroppable } from "@dnd-kit/core"
import { Responsive } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

import { useBuilderStore } from "@/store/useBuilderStore"
import { LayoutDashboard } from "lucide-react"

const AnalystWidgetRenderer = dynamic(
  () => import("./AnalystWidgetRenderer").then((mod) => mod.AnalystWidgetRenderer),
  { ssr: false }
)

interface AnalystBuilderCanvasProps {
  isPreviewMode?: boolean
}

export function AnalystBuilderCanvas({ isPreviewMode = false }: AnalystBuilderCanvasProps) {
  const { layout, setLayout, selectedWidgetId, setSelectedWidgetId, removeWidget } = useBuilderStore()

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable',
    disabled: isPreviewMode
  })

  // ── Measure real container width so the grid always fills the canvas ──
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  const measureWidth = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.getBoundingClientRect().width
      if (w > 0) setContainerWidth(w)
    }
  }, [])

  useEffect(() => {
    measureWidth()
    // Re-measure whenever preview mode changes (sidebars appear/disappear)
    const timeout = setTimeout(measureWidth, 50)
    return () => clearTimeout(timeout)
  }, [isPreviewMode, measureWidth])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => measureWidth())
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [measureWidth])

  const handleLayoutChange = (newGridLayout: any[]) => {
    if (isPreviewMode) return
    const updatedWidgets = layout.widgets.map((widget) => {
      const gl = newGridLayout.find((l: any) => l.i === widget.id)
      if (gl) return { ...widget, x: gl.x, y: gl.y, w: gl.w, h: gl.h }
      return widget
    })
    setLayout({ widgets: updatedWidgets })
  }

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        ;(containerRef as any).current = el
      }}
      className={`flex-1 overflow-y-auto relative ${
        isPreviewMode
          ? 'bg-white dark:bg-slate-950'
          : `bg-slate-100/50 dark:bg-black ${isOver ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/10' : ''}`
      }`}
      onClick={() => {
        if (!isPreviewMode) setSelectedWidgetId(null)
      }}
    >
      {/* Background dot grid — builder mode only */}
      {!isPreviewMode && (
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] bg-[size:24px_24px] pointer-events-none" />
      )}

      {layout.widgets.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-200/80 dark:border-slate-800">
              <LayoutDashboard className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Canvas Ready
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            Drag visualization components from the left sidebar onto the canvas to construct your dashboard.
          </p>
        </div>
      ) : (
        <div className={`min-h-full ${isPreviewMode ? 'p-6 md:p-10' : 'p-4 md:p-8'}`}>
          <Responsive
            className="layout"
            width={containerWidth}
            layouts={{ lg: layout.widgets.map(w => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h })) }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={isPreviewMode ? 110 : 100}
            onLayoutChange={handleLayoutChange}
            isDraggable={!isPreviewMode}
            isResizable={!isPreviewMode}
            draggableHandle=".drag-handle"
            compactType="vertical"
            margin={isPreviewMode ? [20, 20] : [24, 24]}
          >
            {layout.widgets.map((widget) => (
              <div
                key={widget.id}
                className={`rounded-2xl overflow-hidden transition-all duration-200 ${
                  isPreviewMode
                    ? 'bg-white dark:bg-slate-900 shadow-xl border border-slate-200/60 dark:border-slate-800/80'
                    : `bg-white dark:bg-slate-900 shadow-sm border ${
                        selectedWidgetId === widget.id
                          ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                          : 'border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/40 hover:shadow-md'
                      }`
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isPreviewMode) setSelectedWidgetId(widget.id)
                }}
              >
                <AnalystWidgetRenderer
                  widget={widget}
                  isPreviewMode={isPreviewMode}
                  onRemove={() => removeWidget(widget.id)}
                  isSelected={selectedWidgetId === widget.id}
                />
              </div>
            ))}
          </Responsive>
        </div>
      )}
    </div>
  )
}
