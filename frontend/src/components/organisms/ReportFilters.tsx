"use client"

import { useState } from "react"
import { Filter, Calendar, FileText, CheckCircle2 } from "lucide-react"

export function ReportFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")
  
  const handleApply = () => {
    onFilterChange({ status, category })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Filter className="w-4 h-4" /> Filters:
      </div>
      <select 
        className="text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/50 outline-none"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="all">All Statuses</option>
        <option value="ready">Ready</option>
        <option value="generating">Generating</option>
        <option value="error">Error</option>
      </select>
      <select 
        className="text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/50 outline-none"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="executive">Executive</option>
        <option value="financial">Financial</option>
        <option value="operational">Operational</option>
      </select>
      <button onClick={handleApply} className="ml-auto text-sm px-4 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
        Apply Filters
      </button>
    </div>
  )
}
