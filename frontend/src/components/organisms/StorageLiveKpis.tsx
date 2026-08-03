import { HardDrive, Files, Save, DollarSign, DatabaseZap, Clock } from "lucide-react"

interface StorageLiveKpisProps {
  overview?: {
    kpis: {
      total_storage_bytes: number
      total_storage_gb: number
      total_files: number
      active_buckets: number
      total_backups: number
      storage_cost_usd: number
    }
  }
}

export function StorageLiveKpis({ overview }: StorageLiveKpisProps) {
  const kpis = overview?.kpis || {
    total_storage_bytes: 0,
    total_storage_gb: 0,
    total_files: 0,
    active_buckets: 0,
    total_backups: 0,
    storage_cost_usd: 0
  }

  // Helper for human readable size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const cards = [
    {
      title: "Total Storage Used",
      value: formatBytes(kpis.total_storage_bytes),
      trend: "+4.2% vs last month",
      trendUp: true,
      icon: HardDrive,
      color: "emerald"
    },
    {
      title: "Active Files",
      value: kpis.total_files.toLocaleString(),
      trend: "+12% vs last month",
      trendUp: true,
      icon: Files,
      color: "blue"
    },
    {
      title: "Active Buckets",
      value: kpis.active_buckets.toLocaleString(),
      trend: "0% vs last month",
      trendUp: true,
      icon: DatabaseZap,
      color: "purple"
    },
    {
      title: "Est. Monthly Cost",
      value: `$${kpis.storage_cost_usd.toFixed(2)}`,
      trend: "-2.1% (optimized)",
      trendUp: false,
      icon: DollarSign,
      color: "rose"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="group relative bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-500/10 text-${card.color}-600 dark:text-${card.color}-400 group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className={`font-medium ${card.trendUp ? 'text-emerald-500' : 'text-emerald-500'}`}>
              {card.trend}
            </span>
          </div>

          {/* Sparkline background effect */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${card.color}-500 to-${card.color}-300 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        </div>
      ))}
    </div>
  )
}
