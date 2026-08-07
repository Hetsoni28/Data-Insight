import { Search, Filter, SlidersHorizontal } from "lucide-react"

export function DatasetEnterpriseSearch({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter = "all",
  setStatusFilter
}: { 
  searchQuery: string, 
  setSearchQuery: (q: string) => void,
  statusFilter?: string,
  setStatusFilter?: (v: string) => void
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search datasets by name, tags, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm shadow-sm"
        />
      </div>
      {setStatusFilter && (
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300 text-sm font-medium shadow-sm outline-none cursor-pointer appearance-none"
        >
          <option value="all">All Status</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="error">Error</option>
        </select>
      )}
    </div>
  )
}
