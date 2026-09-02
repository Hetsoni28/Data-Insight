"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Loader2, CheckCircle2, ShieldCheck } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface DataCleaningTabProps {
  datasetId: string
  onCleaned?: () => void
}

export function DataCleaningTab({ datasetId, onCleaned }: DataCleaningTabProps) {
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/tenant-datasets/${datasetId}/cleaning/suggestions`)
      const data = res.data?.data || []
      setSuggestions(data)
      setSelectedIndices(new Set(data.map((_: any, i: number) => i)))
    } catch (e) {
      toast.error("Failed to generate cleaning suggestions")
    } finally {
      setLoading(false)
    }
  }

  const applyFixes = async () => {
    if (selectedIndices.size === 0) return
    setApplying(true)
    try {
      const opsToApply = suggestions.filter((_, i) => selectedIndices.has(i))
      await api.post(`/tenant-datasets/${datasetId}/cleaning/apply`, { operations: opsToApply })
      toast.success("Cleaning operations applied successfully!")
      setSuggestions([])
      setSelectedIndices(new Set())
      if (onCleaned) onCleaned()
    } catch (e) {
      toast.error("Failed to apply fixes")
    } finally {
      setApplying(false)
    }
  }

  const toggleSelection = (idx: number) => {
    const newSet = new Set(selectedIndices)
    if (newSet.has(idx)) {
      newSet.delete(idx)
    } else {
      newSet.add(idx)
    }
    setSelectedIndices(newSet)
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-[#0f4b36] to-[#064e3b] rounded-3xl p-10 relative overflow-hidden shadow-2xl border border-emerald-500/20 mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-emerald-300 mix-blend-overlay" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">
            AI Data Cleaning
          </h3>
          <p className="text-emerald-50 md:text-lg font-medium mb-6 leading-relaxed">
            Our agent will scan your dataset to identify dirty data—such as missing values, inconsistencies, or duplicates—and suggest concrete fixes to optimize it for analysis.
          </p>
          <Button onClick={analyze} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-12 px-8 rounded-xl">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
            Analyze for Issues
          </Button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-5 mb-6">
            <h4 className="text-xl font-bold text-slate-800 dark:text-white">Suggested Fixes</h4>
            <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-xl text-sm">{suggestions.length} issues found</span>
          </div>
          
          <div className="space-y-4">
            {suggestions.map((s, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <Checkbox 
                  checked={selectedIndices.has(idx)}
                  onCheckedChange={() => toggleSelection(idx)}
                  className="mt-1 w-5 h-5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{s.operation} on &apos;{s.column}&apos;</p>
                  <p className="text-sm text-slate-500 mt-1">{s.reason}</p>
                  {s.value && <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded mt-2 inline-block">Replace with: {s.value}</p>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button onClick={applyFixes} disabled={applying || selectedIndices.size === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-8 rounded-xl">
              {applying ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Apply Selected Fixes ({selectedIndices.size})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}