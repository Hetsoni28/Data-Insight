"use client"

import React from "react"
import { Database, Calendar, ShieldCheck, Lock, ExternalLink, RefreshCw, Cpu, Layers } from "lucide-react"
import { BillingSummary, RentalContractData } from "@/lib/billing.service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BillingHeroProps {
  summary: BillingSummary
  contract: RentalContractData | null
  onOpenPortal: () => void
  onRequestCapacity: () => void
  isPortalLoading: boolean
}

export function BillingHero({
  summary,
  contract,
  onOpenPortal,
  onRequestCapacity,
  isPortalLoading
}: BillingHeroProps) {
  const formatCurrency = (val: number, cur = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const isCustom = summary.plan === "custom" || contract?.contract_type === "custom_global_license"
  const monthlyPrice = contract?.base_price_monthly || summary.mrr || 12500

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#133E2E] dark:bg-emerald-950/40 border border-emerald-800/40 dark:border-emerald-800/60 shadow-2xl">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 pointer-events-none">
        <div className="h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-1/4 translate-y-12 pointer-events-none">
        <div className="h-48 w-48 rounded-full bg-teal-300/15 blur-2xl" />
      </div>

      <div className="relative z-10 p-7 md:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Column — Contract & Environment Identity */}
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/15">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Contract Active · Single-Tenant VPC
              </span>

              {contract?.contract_number && (
                <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-mono font-medium text-emerald-200 border border-emerald-700/50">
                  {contract.contract_number}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
                  <Database className="h-7 w-7 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {isCustom ? "Custom Global License" : "Dedicated Database & System Rental"}
                  </h2>
                  <p className="text-emerald-200/90 text-sm mt-0.5 font-medium">
                    {contract?.deployment_model || "Dedicated Single-Tenant Cloud VPC (AWS / GCP)"} · {contract?.sla_guarantee || "99.99% SLA"}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs md:text-sm text-emerald-100/90">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-emerald-300" />
                <span>
                  Renews: <strong>{formatDate(contract?.renewal_date || summary.current_period_end)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>{contract?.support_tier || "24/7 Dedicated Engineering"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Lock className="h-4 w-4 text-emerald-300" />
                <span>Stripe Encrypted Billing</span>
              </div>
            </div>
          </div>

          {/* Right Column — Rental Pricing & Actions */}
          <div className="flex flex-col items-start lg:items-end gap-5 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-white/10 pt-6 lg:pt-0">
            <div className="text-left lg:text-right">
              <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
                Contracted Rental Fee
              </p>
              <div className="flex items-baseline gap-2 lg:justify-end">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {formatCurrency(monthlyPrice, contract?.currency || summary.currency)}
                </span>
                <span className="text-emerald-200 text-sm font-medium">/ month</span>
              </div>
              <p className="text-emerald-300/80 text-xs mt-1">
                Billed {contract?.billing_cycle || summary.billing_cycle || "annually"} · Term: {contract?.payment_terms || "Annual Advance"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Button
                onClick={onRequestCapacity}
                className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
              >
                <Layers className="h-4 w-4 mr-2" />
                Request Expansion
              </Button>

              <Button
                variant="outline"
                onClick={onOpenPortal}
                disabled={isPortalLoading}
                className="flex-1 lg:flex-none bg-white/10 hover:bg-white/20 text-white border-white/20 px-4 py-2.5 rounded-xl backdrop-blur-md transition-all"
              >
                {isPortalLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2 text-emerald-300" />
                )}
                Customer Portal
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
