import { Database, Lock, Globe, MoreVertical } from "lucide-react"

interface Bucket {
  id: string
  name: string
  type: string
  is_public: boolean
  region: string
  file_count: number
  total_bytes: number
  created_at: string
}

interface StorageBucketManagementProps {
  buckets?: Bucket[]
}

export function StorageBucketManagement({ buckets = [] }: StorageBucketManagementProps) {
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
          <Database className="h-5 w-5 text-emerald-500" />
          Buckets
        </h3>
        <button className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
          Create Bucket
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex-1 space-y-3 custom-scrollbar">
        {buckets.map(bucket => (
          <div key={bucket.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  {bucket.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                    {bucket.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{bucket.type.replace('_', ' ')}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span>{bucket.region}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatBytes(bucket.total_bytes)}</p>
                  <p className="text-xs text-slate-500">{bucket.file_count.toLocaleString()} files</p>
                </div>
                <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {buckets.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Database className="h-8 w-8 mb-2 opacity-50" />
            <p>No buckets found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
