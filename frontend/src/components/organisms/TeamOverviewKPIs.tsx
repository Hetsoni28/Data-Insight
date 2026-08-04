import { Users, UserCheck, Mail, ShieldAlert } from "lucide-react"

export function TeamOverviewKPIs({ stats }: { stats: any }) {
  if (!stats) return null

  const metrics = [
    {
      title: "Total Members",
      value: stats.total_members,
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-500/10"
    },
    {
      title: "Online Now",
      value: stats.online_now,
      icon: UserCheck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-500/10"
    },
    {
      title: "Pending Invites",
      value: stats.pending_invitations,
      icon: Mail,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-500/10"
    },
    {
      title: "Organization Admins",
      value: stats.total_admins,
      icon: ShieldAlert,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-500/10"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div 
            key={index}
            className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-default"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{metric.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                  {metric.value}
                </h3>
              </div>
              <div className={`p-4 rounded-full ${metric.bg} ${metric.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
