"use client"

import React from "react"
import { FileText, Shield, CheckCircle2, Calendar, Award, Download, Mail, ExternalLink } from "lucide-react"
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
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Master Rental Agreement & SLA Terms
              </CardTitle>
              <CardDescription className="text-xs">
                Authoritative multi-tenant infrastructure contract parameters and compliance guarantees.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="w-fit border-emerald-500 text-emerald-700 dark:text-emerald-400 font-mono">
            {contract.contract_number}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Contract Type</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {contract.contract_type === "custom_global_license" ? "Custom Global License" : "Dedicated System Rental"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Term & Renewal</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {formatDate(contract.start_date)} – {formatDate(contract.renewal_date)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">SLA Guarantee</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {contract.sla_guarantee}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">Deployment Model</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {contract.deployment_model}
            </span>
          </div>
        </div>

        {/* Financial Contract Value Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                Annual Contract Summary
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Total Contract Value: <strong>{formatCurrency(contract.annual_contract_value, contract.currency)}/yr</strong> · Annual Multi-Year Discount: <strong className="text-emerald-600 dark:text-emerald-400">-{formatCurrency(contract.annual_discount, contract.currency)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-lg"
              onClick={() => window.open("mailto:enterprise-support@datainsight.ai?subject=Contract%20Inquiry%20" + contract.contract_number, "_blank")}
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Contact Account Executive
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
