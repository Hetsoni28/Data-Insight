import { Search, X } from "lucide-react"

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
  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Ready", value: "ready" },
    { label: "Processing", value: "processing" },
    { label: "Error", value: "error" },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
      {/* Search Input Bar with explicit icon container */}
      <div className="relative flex-1 w-full flex items-center">
        <div className="absolute left-3.5 flex items-center justify-center pointer-events-none z-10 text-slate-400 dark:text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search datasets by name, tags, or uploader..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-xl outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter Pills */}
      {setStatusFilter && (
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-xl shrink-0 w-full sm:w-auto overflow-x-auto">
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200/60 dark:border-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
