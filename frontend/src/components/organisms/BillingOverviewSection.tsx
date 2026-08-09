import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, CreditCard } from "lucide-react"

interface BillingSummary {
  plan: string
  subscription_status: string
  billing_cycle: string
  currency: string
  current_period_end: string | null
  cancel_at: string | null
  mrr: number
}

interface BillingOverviewSectionProps {
  summary: BillingSummary
  onManageSubscription: () => void
  isManaging: boolean
}

export function BillingOverviewSection({ summary, onManageSubscription, isManaging }: BillingOverviewSectionProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            Current Plan: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{summary.plan}</span>
          </CardTitle>
          <CardDescription>
            You are currently on the {capitalize(summary.plan)} tier.
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={onManageSubscription} 
          disabled={isManaging}
          className="gap-2"
        >
          {isManaging ? "Redirecting..." : (
            <>
              Manage in Stripe
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(summary.mrr, summary.currency)}<span className="text-lg text-slate-500 font-normal">/mo</span></p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                summary.subscription_status === "active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${summary.subscription_status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                {capitalize(summary.subscription_status)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Billing Cycle</p>
            <p className="text-lg font-medium">{capitalize(summary.billing_cycle)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
