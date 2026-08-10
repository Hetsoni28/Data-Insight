"use client"

import React from "react"
import { DollarSign, FileText, CheckCircle2, ShieldAlert, CreditCard, Download, ArrowRight } from "lucide-react"
import { CostBreakdownData } from "@/lib/billing.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface CostBreakdownCardProps {
  costs: CostBreakdownData | null
  onOpenPortal: () => void
}

export function CostBreakdownCard({ costs, onOpenPortal }: CostBreakdownCardProps) {
  if (!costs) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: costs.currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0B0F17] shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Itemized Cost Breakdown & Current Statement
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time accounting of your contracted infrastructure and any accrued usage.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">
            Status: Current
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Line Items */}
        <div className="space-y-3 text-sm">
          {/* Base Rental Fee */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Dedicated Environment Base Rental
              </span>
              <p className="text-xs text-slate-500">
                Single-Tenant VPC, PostgreSQL 16 DB, 8 vCPU / 32 GB RAM Engine
              </p>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {formatCurrency(costs.base_rental_fee)}
            </span>
          </div>

          {/* Storage */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Storage Allocation ({costs.storage_allocation_gb} GB Contracted)
              </span>
              <p className="text-xs text-slate-500">
                Current usage: {costs.storage_used_gb} GB · {costs.storage_overage_gb > 0 ? `${costs.storage_overage_gb} GB Overage` : "Included in Base Rental"}
              </p>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {costs.storage_overage_fee > 0 ? formatCurrency(costs.storage_overage_fee) : "$0.00"}
            </span>
          </div>

          {/* AI Tokens */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                AI Processing Tokens ({(costs.ai_token_allocation / 1_000_000).toFixed(0)}M Monthly Quota)
              </span>
              <p className="text-xs text-slate-500">
                Current usage: {(costs.ai_tokens_used / 1_000_000).toFixed(2)}M Tokens · {costs.ai_overage_tokens > 0 ? "Overage Tier Active" : "Included in Base Rental"}
              </p>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {costs.ai_overage_fee > 0 ? formatCurrency(costs.ai_overage_fee) : "$0.00"}
            </span>
          </div>

          {/* Backup & Disaster Recovery */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Automated 30-Day Backup & Disaster Recovery
              </span>
              <p className="text-xs text-slate-500">
                Multi-AZ WAL Archival, 15-min RPO, 1-hr RTO
              </p>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              $0.00
            </span>
          </div>

          {/* Support */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800/60">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                24/7 Dedicated Engineering Support & 99.99% SLA
              </span>
              <p className="text-xs text-slate-500">
                Direct Slack / MS Teams bridge with enterprise engineering team
              </p>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              $0.00
            </span>
          </div>
        </div>

        <Separator className="bg-slate-200 dark:bg-white/5" />

        {/* Totals Section */}
        <div className="space-y-2 pt-1 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {formatCurrency(costs.subtotal)}
            </span>
          </div>

          {costs.discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Contract Discount</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(costs.discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Estimated Tax (0%)</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              $0.00
            </span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                Total Contracted Amount
              </span>
              <p className="text-xs text-slate-500">
                Current period: {formatDate(costs.billing_period_start)} – {formatDate(costs.billing_period_end)}
              </p>
            </div>
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(costs.total_due)}
            </span>
          </div>
        </div>

        {/* Action Footnote */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Payment Term: <strong className="text-slate-900 dark:text-white">{costs.payment_terms}</strong>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPortal}
            className="text-xs font-semibold rounded-lg"
          >
            Manage Payment Methods
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
