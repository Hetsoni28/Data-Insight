import { ShieldCheck, HardDrive, AlertCircle, PlayCircle, Clock } from "lucide-react"

interface Backup {
  id: string
  name: string
  type: string
  status: string
  size_bytes: number
  is_automated: boolean
  created_at: string
  completed_at: string
}

interface StorageBackupCenterProps {
  backups?: Backup[]
}

export function StorageBackupCenter({ backups = [] }: StorageBackupCenterProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <ShieldCheck className="h-4 w-4 text-emerald-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />
      default: return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
      default: return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-emerald-500" />
          Backup Center
        </h3>
        <button className="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors">
          Run Manual Backup
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex-1 space-y-3 custom-scrollbar">
        {backups.map(backup => (
          <div key={backup.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(backup.status)}
                <h4 className="font-medium text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                  {backup.name}
                </h4>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getStatusColor(backup.status)}`}>
                {backup.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <p className="mb-1 uppercase tracking-wider text-[10px] text-slate-400">Type</p>
                <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">{backup.type}</p>
              </div>
              <div>
                <p className="mb-1 uppercase tracking-wider text-[10px] text-slate-400">Size</p>
                <p className="font-medium text-slate-700 dark:text-slate-300">{formatBytes(backup.size_bytes)}</p>
              </div>
              <div className="col-span-2 flex justify-between items-center pt-2 mt-2 border-t border-slate-200 dark:border-white/5">
                <span>Created: {new Date(backup.created_at).toLocaleDateString()}</span>
                <button className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Restore</button>
              </div>
            </div>
          </div>
        ))}
        {backups.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <HardDrive className="h-8 w-8 mb-2 opacity-50" />
            <p>No backups available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
