import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: number; // e.g. 12 (positive) or -5 (negative)
  trendLabel?: string;
  delay?: number;
}

export function MetricCard({ title, value, icon: Icon, trend, trendLabel, delay = 0 }: MetricCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col p-5 bg-white dark:bg-white/5 rounded-lg border border-slate-200/60 dark:border-white/10 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24 -mr-6 -mt-6" />
      </div>

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md group-hover:scale-110 transition-transform">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">{title}</span>
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium">
              <span className={`flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                {Math.abs(trend)}%
              </span>
              <span className="text-slate-400">{trendLabel || 'vs last month'}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative hover line */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
    </motion.div>
  )
}
