"use client"
import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Building2,
  Server,
  Mail,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function PricingSection() {
  const [annualBilling, setAnnualBilling] = useState<boolean>(true)

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* ── SECTION HEADER WITH VIEWPORT ANIMATION ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Enterprise System Rental &amp;{" "}
            <span className="text-emerald-600">Dedicated Platform Licensing.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Rent Data Insight as a turn-key private AI Business Intelligence infrastructure for your company,
            or white-label it for your enterprise clients and subsidiaries.
          </p>

          {/* Billing Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs font-semibold">
            <span className={!annualBilling ? "text-slate-950 font-bold" : "text-slate-500"}>Monthly Rental</span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className="relative w-12 h-6 rounded-full bg-slate-200 p-0.5 transition-colors focus:outline-none cursor-pointer"
            >
              <motion.div
                layout
                className={`w-5 h-5 rounded-full bg-[#10B981] shadow-xs ${
                  annualBilling ? "translate-x-6" : "translate-x-0"
                }`}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={annualBilling ? "text-slate-950 font-bold" : "text-slate-500"}>
              Annual Commitment <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Save $30,000/yr</span>
            </span>
          </div>
        </motion.div>

        {/* ── 2 TIERS PRICING GRID WITH SMOOTH STAGGER & HOVER LIFT ── */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          
          {/* Tier 1: Dedicated Enterprise System Rental ($15,000) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.25 } }}
            className="p-7 sm:p-9 rounded-2xl bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between space-y-8 relative hover:shadow-emerald-500/20 transition-all"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">Dedicated System Rental</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Complete turn-key AI Business Intelligence system rental hosted in a dedicated, isolated single-tenant VPC.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <Server className="h-6 w-6" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
                    {annualBilling ? "$12,500" : "$15,000"}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">/ month</span>
                </div>
                <span className="text-xs text-emerald-700 font-medium block mt-1">
                  {annualBilling ? "Billed annually ($150,000/yr) — Save $30,000" : "Billed monthly with flexible term"}
                </span>
              </div>

              <ul className="space-y-3 pt-4 text-xs text-slate-700 border-t border-slate-100">
                {[
                  "Dedicated single-tenant cloud deployment (AWS / GCP / Azure)",
                  "Unlimited internal users, analysts & executive accounts",
                  "Full white-labeling with custom domain (bi.yourcompany.com)",
                  "Living multi-tab Excel spreadsheet compiler engine",
                  "Autonomous 6-stage AI intelligence & anomaly cleansing pipeline",
                  "Unlimited CSV, Excel, PostgreSQL, Snowflake & BigQuery connectors",
                  "Zero data training retention & SOC2 Type II enterprise compliance",
                  "99.99% Uptime SLA with 24/7 dedicated engineering support",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-800 leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              asChild
              size="lg"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Link href="/login" className="inline-flex items-center justify-center gap-2">
                <span>Request System Access</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </Button>
          </motion.div>

          {/* Tier 2: Custom Enterprise & Global Whitelabel License */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.25 } }}
            className="p-7 sm:p-9 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col justify-between space-y-8 hover:shadow-2xl hover:border-slate-300 transition-all"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">Custom Global License</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    For conglomerates, holding groups, and software providers wanting full platform whitelabel &amp; resale rights.
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
                    Custom
                  </span>
                  <span className="text-sm text-slate-500 font-medium">/ annual contract</span>
                </div>
                <span className="text-xs text-slate-500 font-medium block mt-1">
                  Tailored scope, on-premise air-gap, or multi-tenant resale licensing
                </span>
              </div>

              <ul className="space-y-3 pt-4 text-xs text-slate-700 border-t border-slate-100">
                {[
                  "On-premise air-gapped VPC or multi-region deployment",
                  "Multi-tenant client sub-organizations & isolated workspaces",
                  "Custom fine-tuned localized LLM adapters & ERP connectors (SAP/Oracle)",
                  "Complete whitelabeling (custom CSS, logos, domains, and emails)",
                  "Full source code audit, escrow guarantee & dedicated Solutions Architect",
                  "Custom enterprise SLAs with dedicated 1-on-1 executive onboarding",
                  "Tailored data retention & bespoke security policy enforcement",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-800 leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-slate-300 hover:bg-slate-50 text-slate-900 text-sm font-bold h-12 rounded-xl cursor-pointer"
            >
              <a href="mailto:licensing@datainsight.com" className="inline-flex items-center justify-center gap-2">
                <Mail className="h-4 w-4 text-slate-600 shrink-0" />
                <span>Contact Sales &amp; Licensing</span>
              </a>
            </Button>
          </motion.div>

        </div>

      </div>
    </section>
  )
}
