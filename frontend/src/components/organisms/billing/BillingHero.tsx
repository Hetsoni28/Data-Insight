"use client"

import React from "react"
import { motion } from "framer-motion"
import { Database, Calendar, ShieldCheck, Lock, ExternalLink, RefreshCw, Layers, Sparkles } from "lucide-react"
import { BillingSummary, RentalContractData } from "@/lib/billing.service"
import { Button } from "@/components/ui/button"

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
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c291e] via-[#133e2e] to-[#091e16] dark:from-slate-900 dark:via-emerald-950/60 dark:to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20"
    >
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 pointer-events-none">
        <div className="h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-1/4 translate-y-12 pointer-events-none">
        <div className="h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 p-7 md:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left Column — Contract & Environment Identity */}
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white shrink-0">
                  <Database className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {isCustom ? "Custom Global License" : "Dedicated Database & System Rental"}
                  </h2>
                  <p className="text-emerald-200/90 text-xs md:text-sm mt-0.5 font-medium flex items-center gap-2">
                    <span>{contract?.deployment_model || "Dedicated Single-Tenant Cloud VPC (AWS / GCP)"}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{contract?.sla_guarantee || "99.99% SLA"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-emerald-100/90">
              <div className="flex items-center gap-1.5 bg-black/30 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>
                  Renews: <strong className="text-white">{formatDate(contract?.renewal_date || summary.current_period_end)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{contract?.support_tier || "24/7 Dedicated Engineering"}</span>
              </div>
            </div>
          </div>

          {/* Right Column — Rental Pricing & Actions */}
          <div className="flex flex-col items-start lg:items-end gap-5 shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-white/10 pt-6 lg:pt-0">
            <div className="text-left lg:text-right">
              <p className="text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-1">
                Contracted Rental Fee
              </p>
              <div className="flex items-baseline gap-2 lg:justify-end">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
                  {formatCurrency(monthlyPrice, contract?.currency || summary.currency)}
                </span>
                <span className="text-emerald-200 text-sm font-semibold">/ month</span>
              </div>
              <p className="text-emerald-300/80 text-xs mt-1 font-medium">
                Billed {contract?.billing_cycle || summary.billing_cycle || "annually"} • Term: {contract?.payment_terms || "Annual Advance"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <Button
                onClick={onRequestCapacity}
                className="flex-1 lg:flex-none bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <Layers className="h-4 w-4 mr-2" />
                Request Expansion
              </Button>

              <Button
                variant="outline"
                onClick={onOpenPortal}
                disabled={isPortalLoading}
                className="flex-1 lg:flex-none bg-white/10 hover:bg-white/20 text-white border-white/20 px-5 py-3 rounded-xl backdrop-blur-md font-bold transition-all"
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
    </motion.div>
  )
}
