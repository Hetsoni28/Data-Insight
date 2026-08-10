"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Database, Sparkles, ArrowRight, ArrowLeft, Loader2, Search, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { toast } from "sonner"

interface Dataset {
  id: string
  name: string
  row_count: number
  status: string
}

interface AIDashboardGenerateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AIDashboardGenerateModal({ isOpen, onClose }: AIDashboardGenerateModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Data
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingDatasets, setLoadingDatasets] = useState(false)
  
  // Selection & Input
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  
  // Generation
  const [isGenerating, setIsGenerating] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedDatasetId(null)
      setPrompt("")
      setSearchQuery("")
      fetchDatasets()
    }
  }, [isOpen])

  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true)
      // Real backend endpoint for fetching datasets
      const res = await api.get('/tenant-datasets')
      // Ensure we have an array (handle wrapper {status, data} if present)
      const dataArray = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setDatasets(dataArray)
    } catch (error) {
      console.error("Failed to fetch datasets", error)
      toast.error("Failed to load your datasets.")
    } finally {
      setLoadingDatasets(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedDatasetId || !prompt.trim()) return

    try {
      setStep(3)
      setIsGenerating(true)
      
      const res = await api.post('/tenant-dashboards/ai-generate', {
        dataset_id: selectedDatasetId,
        prompt: prompt.trim()
      })
      
      const newDashboardId = res.data?.id
      if (newDashboardId) {
        toast.success("Dashboard successfully generated!")
        onClose()
        router.push(`/organization-admin/dashboard/builder/${newDashboardId}`)
      } else {
        throw new Error("Invalid response from generator")
      }
    } catch (error: any) {
      console.error("AI Generation failed", error)
      toast.error(error.response?.data?.detail || "AI generation failed. Please try again.")
      setStep(2)
    } finally {
      setIsGenerating(false)
    }
  }

  const filteredDatasets = datasets.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId)

  // Suggestions for prompt
  const suggestions = [
    "Analyze sales trends over the last 12 months",
    "Show a breakdown of revenue by product category",
    "Highlight anomalies in user engagement metrics"
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0B0F17] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]"
          style={{ minHeight: "500px" }}
        >
          {/* Close Button */}
          {step !== 3 && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Dynamic Content based on Step */}
          <div className="flex-1 flex flex-col p-8 relative z-0 min-h-0">
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full min-h-0"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-6 h-6 text-emerald-500" />
                    Select a Dataset
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Choose the data source you want the AI to analyze for this dashboard.
                  </p>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search datasets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex-1 overflow-y-auto min-h-[240px] pr-2 space-y-3 custom-scrollbar">
                  {loadingDatasets ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      <span className="text-sm">Loading your datasets...</span>
                    </div>
                  ) : filteredDatasets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <Database className="w-8 h-8 opacity-20" />
                      <span className="text-sm">No datasets found.</span>
                    </div>
                  ) : (
                    filteredDatasets.map((d) => {
                      const isSelected = selectedDatasetId === d.id
                      return (
                        <div 
                          key={d.id}
                          onClick={() => setSelectedDatasetId(d.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all duration-200 ${
                            isSelected 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 shadow-sm' 
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-200 dark:hover:border-emerald-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                              <Database className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className={`font-semibold text-sm ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                                {d.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                {(d.row_count || 0).toLocaleString()} rows &bull; {d.status}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 dark:border-white/10 pt-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDatasetId}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                      selectedDatasetId 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {selectedDataset?.name}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                    Describe Your Goal
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">
                    What insights are you looking for? Our AI will design the optimal dashboard layout to answer your questions.
                  </p>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., I want to see our monthly revenue growth, breakdown of sales by region, and top performing products."
                    className="w-full flex-1 p-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Try asking for:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => setPrompt(s)}
                          className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-transparent dark:border-white/5"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 dark:border-white/10 pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                      prompt.trim() 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Dashboard
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-white dark:bg-[#0B0F17] border-2 border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                    <Sparkles className="w-10 h-10 text-emerald-500 animate-pulse" />
                    <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" className="text-emerald-500/40" />
                    </svg>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Architecting Your Dashboard
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto animate-pulse">
                    Analyzing dataset schema and designing the optimal visual layout based on your request...
                  </p>
                </div>

                <div className="flex gap-1.5 mt-8">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-emerald-500 rounded-full"
                      animate={{ y: ["0%", "-100%", "0%"] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
