import React from "react"
import { History, Bot, UploadCloud, Trash2, ShieldCheck, Activity } from "lucide-react"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export function DatasetAuditTimeline({ activities, loading }: { activities: any[], loading: boolean }) {
  const getIcon = (type: string, action: string) => {
    if (type === 'ai_activity') return <Bot className="w-4 h-4 text-indigo-500" />
    if (action.includes('upload')) return <UploadCloud className="w-4 h-4 text-blue-500" />
    if (action.includes('delete')) return <Trash2 className="w-4 h-4 text-rose-500" />
    if (action.includes('security')) return <ShieldCheck className="w-4 h-4 text-emerald-500" />
    return <Activity className="w-4 h-4 text-slate-500" />
  }

  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 5

  const totalPages = Math.ceil((activities?.length || 0) / itemsPerPage)
  const paginatedActivities = activities?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6 shrink-0">
        <History className="w-4 h-4 text-emerald-500" />
        Recent Activities & Logs
      </h3>
      
      <div className="space-y-6 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading activities...</p>
        ) : paginatedActivities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No recent activities.</p>
        ) : (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
            {paginatedActivities.map((act, index) => (
              <div key={act.id + index} className="relative flex items-start gap-4 mb-6 last:mb-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 text-slate-500 shadow shrink-0 z-10">
                  {getIcon(act.type, act.action)}
                </div>
                <div className="flex-1 min-w-0 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm capitalize truncate">
                      {act.action.replace(/[._\-]/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-500 shrink-0 mt-0.5">
                      {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed truncate">
                    {act.type === 'audit' 
                      ? `Action performed by ${act.actor_name}`
                      : `AI Cost: $${act.cost_usd.toFixed(4)} (${act.tokens} tokens)`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && activities.length > 0 && (
        <div className="mt-6 pt-2 shrink-0">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={activities.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {}}
            pageSizeOptions={[5]}
          />
        </div>
      )}
    </div>
  )
}
