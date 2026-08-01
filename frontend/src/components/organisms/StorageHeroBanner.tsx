import { useState } from "react"
import { Search, HardDriveUpload, RefreshCw, Filter, ArchiveRestore, DownloadCloud } from "lucide-react"

interface StorageHeroBannerProps {
  onSearch: (q: string) => void
  onRefresh: () => void
}

export function StorageHeroBanner({ onSearch, onRefresh }: StorageHeroBannerProps) {
  const [search, setSearch] = useState("")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onSearch(e.target.value)
  }

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border border-white/10 p-8 text-white shadow-xl">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide text-emerald-100 uppercase">Enterprise Storage Command Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Storage Operations
          </h1>
          <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
            Monitor, secure, and optimize every file stored across the Data Insight platform. Manage quotas, backups, and lifecycles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search files, buckets..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all backdrop-blur-md"
            />
          </div>
          
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>

          <button
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-900/50 transition-all active:scale-95"
          >
            <HardDriveUpload className="h-4 w-4" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="relative z-10 mt-8 flex flex-wrap gap-2">
        {['All Files', 'Datasets', 'Reports', 'AI Generated', 'Archives', 'Images'].map(f => (
          <button key={f} className="px-4 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
