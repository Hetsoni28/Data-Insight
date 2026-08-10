"use client"

import React from "react"
import { useDroppable } from "@dnd-kit/core"
import { useBuilderStore } from "@/store/useBuilderStore"
import { BarChart3, GripHorizontal, Settings } from "lucide-react"
import { LiveWidgetRenderer } from "./LiveWidgetRenderer"

function WidgetRenderer({ widget, isSelected, isPreviewMode, onClick }: { widget: any, isSelected: boolean, isPreviewMode?: boolean, onClick: () => void }) {
  // Check if widget is unconfigured (requires dataset but none provided)
  const isUnconfigured = widget.type !== 'markdown' && widget.type !== 'ai_insight' && !widget.config?.dataset_id;

  return (
    <div 
      onClick={isPreviewMode ? undefined : onClick}
      className={`relative bg-white dark:bg-card rounded-xl shadow-sm transition-all group overflow-hidden ${
        !isPreviewMode && isSelected 
          ? 'ring-2 ring-emerald-500 z-10 shadow-emerald-500/10 shadow-lg' 
          : 'border border-slate-200 dark:border-white/10 hover:border-emerald-500/30'
      } ${!isPreviewMode ? 'cursor-pointer' : ''}`}
      style={{
        gridColumn: `span ${widget.w}`,
        gridRow: `span ${widget.h}`
      }}
    >
      {/* Sleek static header in builder mode */}
      {!isPreviewMode && (
        <div className="absolute top-0 left-0 right-0 h-10 bg-slate-50/95 dark:bg-card backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-3 z-20 group-hover:bg-slate-100/50 dark:group-hover:bg-white/5 transition-colors">
          <div className="flex items-center text-slate-700 dark:text-white/90 space-x-2">
            <GripHorizontal className="w-4 h-4 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity" />
            <span className="text-xs font-semibold tracking-wide truncate max-w-[150px]">{widget.title}</span>
          </div>
          <div className="flex items-center">
            <div className={`p-1 rounded-md transition-colors ${isSelected ? 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:text-white dark:hover:bg-white/10'}`}>
              <Settings className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={`h-full flex flex-col ${isPreviewMode ? 'p-0' : 'pt-10'}`}>
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
      className={`flex-1 overflow-y-auto p-8 transition-colors duration-300 ${
        isOver && !isPreviewMode 
          ? 'bg-emerald-50/50 dark:bg-emerald-900/10' 
          : 'bg-slate-50 dark:bg-slate-900'
      } ${!isPreviewMode ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:24px_24px]' : ''}`}
    >
      {layout.widgets.length === 0 ? (
        <div className="w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <BarChart3 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">Blueprint Canvas</h2>
          <p className="max-w-md text-center text-slate-500 dark:text-slate-400">
            Your workspace is ready. Drag and drop widgets from the library on the left to start architecting your dashboard.
          </p>
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
