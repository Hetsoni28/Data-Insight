"use client"
import { motion } from "framer-motion"
import { Activity, Clock, Server, AlertTriangle, Key, Layers, Globe, Shield } from "lucide-react"

interface GatewayLiveKpisProps {
  overview: any;
}

export function GatewayLiveKpis({ overview }: GatewayLiveKpisProps) {
  if (!overview) return null

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num)
  }

  const kpis = [
    {
      title: "Total API Requests",
      value: formatNumber(overview.total_requests),
      trend: "+12.5%",
      trendUp: true,
      icon: Activity,
      color: "emerald"
    },
    {
      title: "Today's Requests",
      value: formatNumber(overview.today_requests),
      trend: "+5.2%",
      trendUp: true,
      icon: Globe,
      color: "blue"
    },
    {
      title: "Avg Latency (95p)",
      value: `${overview.avg_latency_ms}ms`,
      trend: "-2.1ms",
      trendUp: true,
      icon: Clock,
      color: "indigo"
    },
    {
      title: "API Availability",
      value: `${overview.api_availability}%`,
      trend: "+0.01%",
      trendUp: true,
      icon: Server,
      color: "emerald"
    },
    {
      title: "Active API Keys",
      value: overview.active_api_keys,
      trend: "+2",
      trendUp: true,
      icon: Key,
      color: "amber"
    },
    {
      title: "Developer Apps",
      value: overview.developer_apps,
      trend: "Stable",
      trendUp: true,
      icon: Layers,
      color: "purple"
    },
    {
      title: "Failed Requests",
      value: formatNumber(overview.failed_requests),
      trend: `${overview.error_rate.toFixed(2)}% rate`,
      trendUp: false,
      icon: AlertTriangle,
      color: "red"
    },
    {
      title: "Threat Level",
      value: "Low",
      trend: "No alerts",
      trendUp: true,
      icon: Shield,
      color: "emerald"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + (idx * 0.05) }}
          className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-none p-5 hover:border-emerald-500/30 transition-colors group relative overflow-hidden"
        >
          {/* subtle background glow on hover */}
          <div className={`absolute -inset-1 bg-gradient-to-r from-${kpi.color}-500/0 to-${kpi.color}-500/0 group-hover:from-${kpi.color}-500/5 group-hover:to-transparent blur-xl transition-all duration-500`} />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{kpi.title}</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{kpi.value}</h4>
              <p className={`text-xs font-semibold ${kpi.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {kpi.trend}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-50 dark:bg-${kpi.color}-500/10 flex items-center justify-center text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
