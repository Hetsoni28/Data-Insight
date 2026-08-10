import { Database, UploadCloud, Cpu, AlertTriangle, HardDrive, LayoutDashboard, FileSpreadsheet, Activity } from "lucide-react"

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function DatasetExecutiveKPIs({ stats }: { stats: any }) {
  if (!stats) return null
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Datasets</p>
          <Database className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_datasets}</h3>
      </div>
      
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Processing</p>
          <Cpu className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.processing_jobs}</h3>
      </div>
      
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-rose-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Failed Jobs</p>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.failed_jobs}</h3>
      </div>
      
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Storage Used</p>
          <HardDrive className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formatBytes(stats.storage_used_bytes)}</h3>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Rows Analyzed</p>
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {stats.rows_processed > 1000 ? (stats.rows_processed / 1000).toFixed(1) + 'k' : stats.rows_processed}
        </h3>
      </div>
      
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Quality Score</p>
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avg_quality_score.toFixed(0)}</h3>
      </div>
      
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Dashboards</p>
          <LayoutDashboard className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.dashboards_created}</h3>
      </div>
      
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase">AI Excels</p>
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.ai_excel_generated}</h3>
      </div>
    </div>
  )
}
