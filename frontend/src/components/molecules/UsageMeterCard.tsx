import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageMeterCardProps {
  title: string
  icon: LucideIcon
  used: number
  limit: number | null
  pct: number
  warningState: "normal" | "warning" | "high" | "critical" | "limit"
}

export function UsageMeterCard({ title, icon: Icon, used, limit, pct, warningState }: UsageMeterCardProps) {
  // Determine progress bar color based on state
  const progressColor = {
    normal: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-400 dark:bg-amber-300",
    high: "bg-orange-500 dark:bg-orange-400",
    critical: "bg-red-500 dark:bg-red-400",
    limit: "bg-red-600 dark:bg-red-500",
  }[warningState] || "bg-emerald-500"

  const iconColor = {
    normal: "text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10",
    warning: "text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10",
    high: "text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10",
    critical: "text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/10",
    limit: "text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10",
  }[warningState] || "text-slate-500 bg-slate-100 dark:bg-slate-800"

  // Format numbers (e.g. 100000 -> 100,000)
  const formatNumber = (num: number) => new Intl.NumberFormat("en-US").format(num)
  const limitDisplay = limit === null ? "Unlimited" : formatNumber(limit)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mb-2">
          <div className="text-2xl font-bold">
            {formatNumber(used)}
            <span className="text-sm font-normal text-slate-500 ml-1">
              / {limitDisplay}
            </span>
          </div>
          {limit !== null && (
            <div className="text-xs font-medium text-slate-500">
              {Math.min(100, Math.round(pct))}%
            </div>
          )}
        </div>
        
        {limit !== null ? (
          <Progress 
            value={Math.min(100, pct)} 
            className="h-2"
            indicatorClassName={progressColor}
          />
        ) : (
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-slate-300 dark:bg-slate-600 opacity-50" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
