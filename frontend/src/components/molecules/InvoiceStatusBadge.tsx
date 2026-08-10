import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, AlertCircle, XCircle, FileText } from "lucide-react"

interface InvoiceStatusBadgeProps {
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  switch (status) {
    case "paid":
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 flex w-fit items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Paid
        </Badge>
      )
    case "open":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 flex w-fit items-center gap-1">
          <Circle className="h-3 w-3" />
          Open
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-slate-700 flex w-fit items-center gap-1">
          <FileText className="h-3 w-3" />
          Draft
        </Badge>
      )
    case "uncollectible":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 flex w-fit items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Uncollectible
        </Badge>
      )
    case "void":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 flex w-fit items-center gap-1">
          <XCircle className="h-3 w-3" />
          Void
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="flex w-fit items-center gap-1">
          {status}
        </Badge>
      )
  }
}
