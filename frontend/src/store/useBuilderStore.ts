import { create } from 'zustand'

export type WidgetType = 'kpi' | 'chart_bar' | 'chart_line' | 'chart_pie' | 'chart_scatter' | 'data_table' | 'ai_insight' | 'markdown'

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  x: number
  y: number
  w: number
  h: number
  config: Record<string, any>
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
}

interface BuilderState {
  layout: DashboardLayout
  selectedWidgetId: string | null
  isDirty: boolean
  
  // Actions
  setLayout: (layout: DashboardLayout) => void
  addWidget: (widget: DashboardWidget) => void
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void
  removeWidget: (id: string) => void
  setSelectedWidgetId: (id: string | null) => void
  
  // Undo/Redo logic could be added here later using middleware
}

export const useBuilderStore = create<BuilderState>((set) => ({
  layout: { widgets: [] },
  selectedWidgetId: null,
  isDirty: false,

  setLayout: (layout) => set({ layout, isDirty: false }),
  
  addWidget: (widget) => set((state) => ({
    layout: { ...state.layout, widgets: [...state.layout.widgets, widget] },
    isDirty: true
  })),
  
  updateWidget: (id, updates) => set((state) => ({
    layout: {
      ...state.layout,
      widgets: state.layout.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
    },
    isDirty: true
  })),
  
  removeWidget: (id) => set((state) => ({
    layout: {
      ...state.layout,
      widgets: state.layout.widgets.filter(w => w.id !== id)
    },
    selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    isDirty: true
  })),
  
  setSelectedWidgetId: (id) => set({ selectedWidgetId: id })
}))
