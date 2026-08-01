import { Building, AlertTriangle } from "lucide-react"

interface OrganizationUsage {
  id: string
  name: string
  used_bytes: number
  max_storage_gb: number
  file_count: number
  percent_used: number
}

interface StorageOrganizationUsageProps {
  organizations?: OrganizationUsage[]
}

export function StorageOrganizationUsage({ organizations = [] }: StorageOrganizationUsageProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Building className="h-5 w-5 text-emerald-500" />
          Organization Storage Usage
        </h3>
        <button className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
          View All
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex-1 space-y-4 custom-scrollbar">
        {organizations.map(org => {
          const isWarning = org.percent_used > 80
          const isCritical = org.percent_used > 95
          
          return (
            <div key={org.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                    {org.name}
                    {isCritical && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {org.file_count.toLocaleString()} files stored
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {formatBytes(org.used_bytes)}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ {org.max_storage_gb}GB</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${org.percent_used}%` }}
                ></div>
              </div>
            </div>
          )
        })}

        {organizations.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Building className="h-8 w-8 mb-2 opacity-50" />
            <p>No organization data available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
