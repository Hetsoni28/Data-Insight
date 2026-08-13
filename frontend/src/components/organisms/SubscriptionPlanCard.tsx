"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, Server, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlanCardProps {
  title: string
  description: string
  icon: any
  price: string
  priceSub: string
  features: string[]
  isFeatured?: boolean
  badgeLabel?: string
  actionLabel: string
  onAction: () => void
}

export function SubscriptionPlanCard({
  title, description, icon: Icon, price, priceSub,
  features, isFeatured, badgeLabel, actionLabel, onAction
}: PlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={`p-7 rounded-2xl flex flex-col justify-between space-y-6 relative transition-all ${
        isFeatured
          ? "bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl hover:shadow-2xl hover:border-slate-300 dark:hover:border-white/20"
      }`}
    >
      {badgeLabel && (
        <div className="absolute top-5 right-5">
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2.5 py-1 rounded-full">
            {badgeLabel}
          </span>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            isFeatured
              ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{price}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{priceSub}</span>
          </div>
        </div>

        <ul className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={onAction}
        className={`w-full rounded-xl font-bold text-sm h-11 ${
          isFeatured
            ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900"
        }`}
      >
        {actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  )
}

// ── Plan data constants (matching PricingSection.tsx) ─────────────────────────
export const DEDICATED_RENTAL_FEATURES = [
  "Dedicated single-tenant cloud deployment (AWS / GCP / Azure)",
  "Unlimited internal users, analysts & executive accounts",
  "Full white-labeling with custom domain (bi.yourcompany.com)",
  "Living multi-tab Excel spreadsheet compiler engine",
  "Autonomous 6-stage AI intelligence & anomaly cleansing pipeline",
  "Unlimited CSV, Excel, PostgreSQL, Snowflake & BigQuery connectors",
  "Zero data training retention & SOC2 Type II enterprise compliance",
  "99.99% Uptime SLA with 24/7 dedicated engineering support",
]

export const CUSTOM_LICENSE_FEATURES = [
  "On-premise air-gapped VPC or multi-region deployment",
  "Multi-tenant client sub-organizations & isolated workspaces",
  "Custom fine-tuned localized LLM adapters & ERP connectors (SAP/Oracle)",
  "Complete whitelabeling (custom CSS, logos, domains, and emails)",
  "Full source code audit, escrow guarantee & dedicated Solutions Architect",
  "Custom enterprise SLAs with dedicated 1-on-1 executive onboarding",
  "Tailored data retention & bespoke security policy enforcement",
]
