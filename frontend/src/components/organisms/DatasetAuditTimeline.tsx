import React from "react"
import { History, Bot, UploadCloud, Trash2, ShieldCheck, Activity, Cpu, Sparkles } from "lucide-react"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export function DatasetAuditTimeline({ activities, loading }: { activities: any[], loading: boolean }) {
  const getIcon = (type: string, action: string) => {
    if (type === 'ai_activity') return <Bot className="w-4 h-4 text-teal-400" />
    if (action.includes('upload')) return <UploadCloud className="w-4 h-4 text-emerald-400" />
    if (action.includes('delete')) return <Trash2 className="w-4 h-4 text-rose-400" />
    if (action.includes('security') || action.includes('analyze')) return <Sparkles className="w-4 h-4 text-amber-400" />
    return <Activity className="w-4 h-4 text-indigo-400" />
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
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 shrink-0 pb-4 border-b border-slate-200/80 dark:border-white/10">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-wide">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          Audit & AI Activity Stream
        </h3>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
          Live Feed
        </span>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-12">
            <Activity className="w-5 h-5 animate-spin text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading activity stream...</p>
          </div>
        ) : paginatedActivities.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No activity recorded for this workspace yet.</p>
          </div>
        ) : (
          <div className="relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500/40 before:via-slate-200 dark:before:via-white/10 before:to-transparent">
            {paginatedActivities.map((act, index) => (
              <div key={act.id + index} className="relative flex items-start gap-3.5 mb-5 last:mb-0 group">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-500 shadow-sm shrink-0 z-10 group-hover:scale-105 transition-transform">
                  {getIcon(act.type, act.action)}
                </div>
                
                <div className="flex-1 min-w-0 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs capitalize truncate">
                      {act.action.replace(/[._\-]/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="truncate">
                      {act.type === 'audit' 
                        ? `Actor: ${act.actor_name}`
                        : `Tokens: ${act.tokens?.toLocaleString() || 'N/A'}`
                      }
                    </span>
                    {act.type === 'ai_activity' && (
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ${act.cost_usd.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && activities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 shrink-0">
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
