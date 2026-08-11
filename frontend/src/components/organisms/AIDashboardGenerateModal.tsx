"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Database, Sparkles, ArrowRight, ArrowLeft, Loader2, Search, CheckCircle2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
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
  const pathname = usePathname()
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
        const targetBase = pathname.includes("/organization-admin") ? "/organization-admin" : "/analyst"
        router.push(`${targetBase}/dashboard/builder/${newDashboardId}`)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col box-border"
        >
          {/* Close Button */}
          {step !== 3 && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all z-30"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dynamic Content based on Step */}
          <div className="flex-1 flex flex-col p-5 md:p-6 relative z-0 box-border">
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="flex flex-col w-full box-border"
              >
                <div className="mb-4 pr-8">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <Database className="w-5 h-5 text-emerald-500" />
                    Select a Dataset
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Choose the data source you want the AI to analyze for this dashboard.
                  </p>
                </div>

                <div className="relative mb-3.5 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search datasets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white transition-all box-border"
                  />
                </div>

                <div className="max-h-[310px] overflow-y-auto pr-3 pl-1 py-1 space-y-2.5 custom-scrollbar w-full box-border">
                  {loadingDatasets ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                      <span className="text-xs font-medium">Loading your datasets...</span>
                    </div>
                  ) : filteredDatasets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-1">
                      <Database className="w-6 h-6 opacity-20" />
                      <span className="text-xs font-medium">No datasets found.</span>
                    </div>
                  ) : (
                    filteredDatasets.map((d) => {
                      const isSelected = selectedDatasetId === d.id
                      return (
                        <div 
                          key={d.id}
                          onClick={() => setSelectedDatasetId(d.id)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer border transition-all duration-200 box-border w-full ${
                            isSelected 
                              ? 'bg-emerald-500/10 border-emerald-500 shadow-sm' 
                              : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              <Database className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                {d.name}
                              </h4>
                              <p className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-emerald-400/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                {(d.row_count || 0).toLocaleString()} rows &bull; <span className="capitalize">{d.status}</span>
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 w-full">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDatasetId}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all ${
                      selectedDatasetId 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/25 active:scale-95' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="flex flex-col w-full box-border"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full truncate max-w-[240px]">
                      {selectedDataset?.name}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    Describe Your Goal
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    What insights are you looking for? Our AI will design the optimal dashboard layout.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., Show monthly revenue growth, sales breakdown by product, and top metrics."
                    className="w-full h-28 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 box-border leading-relaxed"
                  />
                  
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggestions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => setPrompt(s)}
                          className="text-[11px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-transparent dark:border-slate-800"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3 w-full">
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all ${
                      prompt.trim() 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/25 active:scale-95' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Dashboard
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-10 space-y-5 w-full"
              >
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                    <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    Architecting Your Dashboard
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto animate-pulse">
                    Analyzing dataset schema and designing the optimal visual layout...
                  </p>
                </div>

                <div className="flex gap-1.5 mt-4">
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
