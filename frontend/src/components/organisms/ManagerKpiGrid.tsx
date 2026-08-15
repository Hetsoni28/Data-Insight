import { motion } from "framer-motion"
import { Users, Database, FileText, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react"

function KpiCard({ title, value, change, icon: Icon, index }: any) {
  const isPositive = change > 0
  const isNegative = change < 0
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-none border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="w-14 h-14 rounded-none bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:scale-110 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/20 shadow-sm transition-all duration-500">
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-none transition-colors duration-300 ${
            isPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
            isNegative ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 
            'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{change}%
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
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
