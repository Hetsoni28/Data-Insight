import { motion } from "framer-motion"
import { Users, Database, FileText, Activity, TrendingUp, TrendingDown } from "lucide-react"

function KpiCard({ title, value, change, icon: Icon, index }: any) {
  const isPositive = change > 0
  const isNegative = change < 0
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-emerald-500 transition-all">
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 
            isNegative ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 
            'bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value !== undefined && value !== null ? value : '-'}
        </p>
      </div>
    </motion.div>
  )
}

export function ManagerKpiGrid({ kpis }: { kpis: any }) {
  const data = [
    {
      title: "Active Team Members",
      value: kpis?.active_users,
      icon: Users
    },
    {
      title: "Uploaded Datasets",
      value: kpis?.datasets?.total,
      change: kpis?.datasets?.growth,
      icon: Database
    },
    {
      title: "Reports Generated",
      value: kpis?.reports?.total,
      change: kpis?.reports?.growth,
      icon: FileText
    },
    {
      title: "AI Analysis Requests",
      value: kpis?.ai_requests?.total,
      change: kpis?.ai_requests?.growth,
      icon: Activity
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((item, index) => (
        <KpiCard key={item.title} {...item} index={index} />
      ))}
    </div>
  )
}
