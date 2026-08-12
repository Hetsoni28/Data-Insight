"use client"

import React, { useState } from "react"
import { AnalystChartsHub } from "./AnalystChartsHub"
import { AnalystChartBuilder } from "./AnalystChartBuilder"
import { AnimatePresence, motion } from "framer-motion"

type ViewState = 'hub' | 'builder'

export function AnalystChartsShell() {
  const [view, setView] = useState<ViewState>('hub')
  const [activeChartId, setActiveChartId] = useState<string | null>(null)

  const handleCreateNew = () => {
    setActiveChartId(null)
    setView('builder')
  }

  const handleEditChart = (chartId: string) => {
    setActiveChartId(chartId)
    setView('builder')
  }

  const handleBackToHub = () => {
    setActiveChartId(null)
    setView('hub')
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {view === 'hub' ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <AnalystChartsHub onCreateNew={handleCreateNew} onEditChart={handleEditChart} />
          </motion.div>
        ) : (
          <motion.div
            key="builder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <AnalystChartBuilder 
              chartId={activeChartId} 
              onBack={handleBackToHub} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
