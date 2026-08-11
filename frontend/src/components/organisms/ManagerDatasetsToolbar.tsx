import { useState, useEffect } from "react"
import { Search, Filter, Upload } from "lucide-react"

export function ManagerDatasetsToolbar({
  onSearch,
  onStatusFilter,
  statusFilter,
  onUpload
}: {
  onSearch: (q: string) => void,
  onStatusFilter: (status: string) => void,
  statusFilter: string,
  onUpload: () => void
}) {
  const [searchTerm, setSearchTerm] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, onSearch])

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search by dataset name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-500 transition-shadow"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="w-full sm:w-40 pl-9 pr-8 py-2 bg-slate-50 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ready">Active</option>
            <option value="profiling">Processing</option>
            <option value="error">Failed</option>
          </select>
        </div>

        <button 
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          Upload Dataset
        </button>
      </div>
    </div>
  )
}
