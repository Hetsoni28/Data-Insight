"use client"

import React from "react"
import { motion } from "framer-motion"
import { DollarSign, CreditCard, ShieldCheck, ArrowRight } from "lucide-react"
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
    if (!dateStr) return "•"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Itemized Cost Breakdown & Statement
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Real-time accounting of your contracted infrastructure and any accrued usage.
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-xs">
              Status: Current
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Line Items */}
          <div className="space-y-4 text-sm">
            {/* Base Rental Fee */}
            <div className="flex items-center justify-between py-1.5">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Dedicated Environment Base Rental
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Single-Tenant VPC, PostgreSQL 16 DB, 8 vCPU / 32 GB RAM Engine
                </p>
              </div>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                {formatCurrency(costs.base_rental_fee)}
              </span>
            </div>

            {/* Storage */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100 dark:border-white/5">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Storage Allocation ({costs.storage_allocation_gb} GB Contracted)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Current usage: {costs.storage_used_gb} GB • {costs.storage_overage_gb > 0 ? `${costs.storage_overage_gb} GB Overage` : "Included in Base Rental"}
                </p>
              </div>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                {costs.storage_overage_fee > 0 ? formatCurrency(costs.storage_overage_fee) : "$0.00"}
              </span>
            </div>

            {/* AI Tokens */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100 dark:border-white/5">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  AI Processing Tokens ({(costs.ai_token_allocation / 1_000_000).toFixed(0)}M Monthly Quota)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Current usage: {(costs.ai_tokens_used / 1_000_000).toFixed(2)}M Tokens • {costs.ai_overage_tokens > 0 ? "Overage Tier Active" : "Included in Base Rental"}
                </p>
              </div>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                {costs.ai_overage_fee > 0 ? formatCurrency(costs.ai_overage_fee) : "$0.00"}
              </span>
            </div>

            {/* Backup & Disaster Recovery */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100 dark:border-white/5">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Automated 30-Day Backup & Disaster Recovery
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Multi-AZ WAL Archival, 15-min RPO, 1-hr RTO
                </p>
              </div>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                $0.00
              </span>
            </div>

            {/* Support */}
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100 dark:border-white/5">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  24/7 Dedicated Engineering Support & 99.99% SLA
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Direct Slack / MS Teams bridge with enterprise engineering team
                </p>
              </div>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-base">
                $0.00
              </span>
            </div>
          </div>

          <Separator className="bg-slate-100 dark:bg-white/5" />

          {/* Totals Section */}
          <div className="space-y-2.5 pt-1 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Subtotal</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrency(costs.subtotal)}
              </span>
            </div>

            {costs.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Contract Discount</span>
                <span className="font-mono">
                  -{formatCurrency(costs.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Estimated Tax (0%)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                $0.00
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-4 border-t border-slate-200 dark:border-white/10">
              <div>
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Total Contracted Amount
                </span>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Current period: {formatDate(costs.billing_period_start)} • {formatDate(costs.billing_period_end)}
                </p>
              </div>
              <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(costs.total_due)}
              </span>
            </div>
          </div>

          {/* Action Footnote */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <CreditCard className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Payment Term: <strong className="text-slate-900 dark:text-white">{costs.payment_terms}</strong>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPortal}
              className="text-xs font-bold rounded-xl border-slate-200 dark:border-white/10 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
            >
              Manage Payment Methods
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
