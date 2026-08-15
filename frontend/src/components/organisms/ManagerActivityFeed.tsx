import { Clock, Activity as ActivityIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function ManagerActivityFeed({ activity }: { activity: any[] }) {
  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-none border border-slate-200/50 dark:border-white/5 shadow-sm h-full flex flex-col justify-center items-center py-16">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-none flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">No recent activity</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-center font-medium">
          No operational activity has been recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-none border border-slate-200/50 dark:border-white/5 shadow-sm h-full relative overflow-hidden group/container">
      {/* Subtle Glow */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 mb-8 tracking-tight relative z-10">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-none">
          <ActivityIcon className="w-5 h-5" />
        </div>
        Recent Activity
      </h2>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-emerald-500/0 before:via-emerald-500/20 before:to-emerald-500/0 z-10">
        {activity.map((item, index) => (
          <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-300">
            <div className="flex items-center justify-center w-10 h-10 rounded-none border-4 border-white/80 dark:border-slate-900/80 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-400 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/30 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors duration-300">
              <Clock className="w-4 h-4" />
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-none bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 group-hover:border-emerald-500/30 group-hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-none border border-emerald-100 dark:border-emerald-500/20">
                  {item.resource_type}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-bold mt-2 leading-relaxed">
                {item.action}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
