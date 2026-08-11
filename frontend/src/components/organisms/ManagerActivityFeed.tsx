import { Clock, Activity as ActivityIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function ManagerActivityFeed({ activity }: { activity: any[] }) {
  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col justify-center items-center py-12">
        <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No recent activity</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
          No operational activity has been recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm h-full">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <ActivityIcon className="w-5 h-5 text-emerald-500" />
        Recent Activity
      </h2>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
        {activity.map((item, index) => (
          <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#121214] bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
              <Clock className="w-4 h-4" />
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {item.resource_type}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {item.action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
