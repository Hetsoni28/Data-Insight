"use client"

import React from "react"
import { motion } from "framer-motion"
import { FileText, Award, Mail } from "lucide-react"
import { RentalContractData } from "@/lib/billing.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ContractDetailsCardProps {
  contract: RentalContractData | null
}

export function ContractDetailsCard({ contract }: ContractDetailsCardProps) {
  if (!contract) return null

  const formatCurrency = (val: number, cur = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Master Rental Agreement & SLA Terms
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Authoritative multi-tenant infrastructure contract parameters and compliance guarantees.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Contract Type</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {contract.contract_type === "custom_global_license" ? "Custom Global License" : "Dedicated System Rental"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Term & Renewal</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {formatDate(contract.start_date)} • {formatDate(contract.renewal_date)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">SLA Guarantee</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {contract.sla_guarantee}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Deployment Model</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {contract.deployment_model}
              </span>
            </div>
          </div>

          {/* Financial Contract Value Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Annual Contract Summary
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Total Contract Value: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(contract.annual_contract_value, contract.currency)}/yr</strong> • Multi-Year Discount: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">-{formatCurrency(contract.annual_discount, contract.currency)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => window.open("mailto:enterprise-support@datainsight.ai?subject=Contract%20Inquiry%20" + contract.contract_number, "_blank")}
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Contact Account Executive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
