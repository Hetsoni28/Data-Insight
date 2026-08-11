import { TrendingUp, TrendingDown } from "lucide-react"

export function TrendBadge({ growth }: { growth?: number }) {
  if (growth === undefined || growth === null) return null
  const isPos = growth >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
      isPos
        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
        : "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"}`}>
      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(growth).toFixed(1)}%
    </span>
  )
}
