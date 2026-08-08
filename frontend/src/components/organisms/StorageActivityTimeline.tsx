import { Activity, UploadCloud, Trash2, Database, ShieldCheck, DownloadCloud } from "lucide-react"

interface ActivityLog {
  id: string
  action: string
  resource_type: string
  tenant_name: string
  metadata: any
  created_at: string
}

interface StorageActivityTimelineProps {
  activities?: ActivityLog[]
}

export function StorageActivityTimeline({ activities = [] }: StorageActivityTimelineProps) {
  const getActionIcon = (action: string) => {
    if (action.includes('upload')) return <UploadCloud className="h-4 w-4 text-emerald-500" />
    if (action.includes('delete')) return <Trash2 className="h-4 w-4 text-red-500" />
    if (action.includes('bucket')) return <Database className="h-4 w-4 text-emerald-500" />
    if (action.includes('download')) return <DownloadCloud className="h-4 w-4 text-teal-600 dark:text-teal-400" />
    if (action.includes('backup')) return <ShieldCheck className="h-4 w-4 text-emerald-500" />
    return <Activity className="h-4 w-4 text-slate-500" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('upload')) return 'bg-emerald-50 dark:bg-emerald-500/20'
    if (action.includes('delete')) return 'bg-red-100 dark:bg-red-500/20'
    if (action.includes('bucket')) return 'bg-emerald-100 dark:bg-emerald-500/20'
    if (action.includes('download')) return 'bg-teal-50 dark:bg-teal-500/20'
    if (action.includes('backup')) return 'bg-emerald-100 dark:bg-emerald-500/20'
    return 'bg-slate-100 dark:bg-white/10'
  }

  const formatAction = (action: string) => {
    return action.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          Recent Activity
        </h3>
        <button className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
          View Logs
        </button>
      </div>

      <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
          
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0B0F17] ${getActionColor(activity.action)} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                {getActionIcon(activity.action)}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-slate-800 dark:text-white">{formatAction(activity.action)}</span>
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{formatTimeAgo(activity.created_at)}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex flex-col gap-1">
                  <p><span className="font-medium text-slate-700 dark:text-slate-300">Tenant:</span> {activity.tenant_name || 'System'}</p>
                  {activity.metadata && activity.metadata.ip && (
                    <p><span className="font-medium text-slate-700 dark:text-slate-300">IP:</span> {activity.metadata.ip}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center text-slate-400 py-8 relative z-10 bg-transparent">
              No recent activity.
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
