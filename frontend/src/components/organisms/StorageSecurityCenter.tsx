import { ShieldCheck, ShieldAlert, Lock, Unlock, Search, Activity } from "lucide-react"

interface StorageSecurity {
  public_files: number
  private_files: number
  encrypted_files: number
  unencrypted_files: number
  malware_scanned_files: number
  health_score: number
}

interface StorageSecurityCenterProps {
  security?: StorageSecurity
}

export function StorageSecurityCenter({ security }: StorageSecurityCenterProps) {
  const data = security || {
    public_files: 0,
    private_files: 0,
    encrypted_files: 0,
    unencrypted_files: 0,
    malware_scanned_files: 0,
    health_score: 100
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500'
    if (score >= 70) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          {data.health_score >= 90 ? (
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          )}
          Security Center
        </h3>
        <span className={`text-2xl font-bold tracking-tight ${getScoreColor(data.health_score)}`}>
          {data.health_score}
        </span>
      </div>

      <div className="p-6 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Access Overview */}
        <div>
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Access Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Unlock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Public Files</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.public_files.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Private Files</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.private_files.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Protection Overview */}
        <div>
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Protection & Scanning</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Encrypted at Rest</p>
                  <p className="text-xs text-slate-500">{data.encrypted_files.toLocaleString()} files protected</p>
                </div>
              </div>
              {data.unencrypted_files > 0 ? (
                <span className="text-xs font-medium text-red-500">{data.unencrypted_files} unprotected</span>
              ) : (
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              )}
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Malware Scanned</p>
                  <p className="text-xs text-slate-500">{data.malware_scanned_files.toLocaleString()} files checked</p>
                </div>
              </div>
              <Activity className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
