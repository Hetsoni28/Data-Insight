"use client"

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { useBuilderStore } from "@/store/useBuilderStore"
import { BarChart3 } from "lucide-react"
import { LiveWidgetRenderer } from "./LiveWidgetRenderer"

function WidgetRenderer({ widget, isSelected, isPreviewMode, onClick }: { widget: any, isSelected: boolean, isPreviewMode?: boolean, onClick: () => void }) {
  // Simple rendering of the widget based on type
  return (
    <div 
      onClick={isPreviewMode ? undefined : onClick}
      className={`relative bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm transition-all group ${
        !isPreviewMode && isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 z-10' : 'border-slate-200 dark:border-white/10'
      } ${!isPreviewMode ? 'cursor-pointer hover:border-emerald-500/50' : ''}`}
      style={{
        gridColumn: `span ${widget.w}`,
        gridRow: `span ${widget.h}`
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-10 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900 flex items-center px-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{widget.title}</h3>
      </div>
      <div className="pt-10 h-full flex flex-col">
        <LiveWidgetRenderer widget={widget} />
      </div>
    </div>
  )
}

export function DashboardBuilderCanvas({ isPreviewMode }: { isPreviewMode?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable',
    disabled: isPreviewMode
  })
  const { layout, selectedWidgetId, setSelectedWidgetId } = useBuilderStore()

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 overflow-y-auto p-8 transition-colors ${
        isOver && !isPreviewMode ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-slate-100 dark:bg-slate-950/50'
      }`}
    >
      {layout.widgets.length === 0 ? (
        <div className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400">
          <BarChart3 className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Empty Canvas</h2>
          <p className="max-w-md text-center">Drag and drop widgets from the sidebar to start building your dashboard.</p>
        </div>
      ) : (
        <div 
          className="grid gap-6 auto-rows-[120px]"
          style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
        >
          {layout.widgets.map((widget) => (
            <WidgetRenderer 
              key={widget.id} 
              widget={widget} 
              isSelected={selectedWidgetId === widget.id}
              isPreviewMode={isPreviewMode}
              onClick={() => setSelectedWidgetId(widget.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
