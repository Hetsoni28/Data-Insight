"use client"

import { Input } from "@/components/ui/input"
import { Sparkles, FileText, Tag } from "lucide-react"

interface DatasetConfigurationProps {
  name: string
  setName: (name: string) => void
  description: string
  setDescription: (desc: string) => void
  disabled: boolean
}

export function DatasetConfiguration({ name, setName, description, setDescription, disabled }: DatasetConfigurationProps) {
  const suggestName = (tag: string) => {
    if (!name) {
      setName(`${tag} Dataset`)
    } else {
      setName(`${name} (${tag})`)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-500" />
            Dataset Name <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Quick Tags:</span>
            <button 
              type="button" 
              onClick={() => suggestName("Production")} 
              disabled={disabled}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium disabled:opacity-50"
            >
              Prod
            </button>
            <span className="text-slate-300">•</span>
            <button 
              type="button" 
              onClick={() => suggestName("Q3 2026")} 
              disabled={disabled}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium disabled:opacity-50"
            >
              Q3
            </button>
          </div>
        </div>
        
        <Input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Q3 2026 Financial Reports"
          className="bg-slate-50/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10 rounded-xl text-sm h-11 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-teal-500" />
          Description <span className="text-slate-400 font-normal lowercase">(Optional)</span>
        </label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl text-sm outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          placeholder="Add context about data sources, methodology, or business domain..."
        />
      </div>
    </div>
  )
}
