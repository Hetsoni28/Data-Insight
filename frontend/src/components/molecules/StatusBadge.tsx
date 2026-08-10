import { CheckCircle, RefreshCw, AlertTriangle } from "lucide-react"

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  if (s === "ready" || s === "success" || s === "active")
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3.5 w-3.5" />{status}</span>
  if (s === "processing")
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"><RefreshCw className="h-3.5 w-3.5 animate-spin" />{status}</span>
  if (s === "failure" || s === "failed" || s === "error")
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400"><AlertTriangle className="h-3.5 w-3.5" />{status}</span>
  return <span className="text-xs text-slate-500 dark:text-slate-400">{status}</span>
}
