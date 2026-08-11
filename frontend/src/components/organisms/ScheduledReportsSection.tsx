"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Mail,
  Send,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  BellRing,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react"

const SCHEDULE_CADENCES = [
  {
    id: "monday",
    title: "Monday 08:00 AM Executive Briefing",
    cadence: "Weekly every Monday at 08:00 AM EST",
    recipients: "Board of Directors, CEO, CFO (12 Executives)",
    channel: "Executive Email + Attached .xlsx Workbook",
    subject: "Executive Intelligence Briefing: Q3 Run-Rate & Margin Scorecard",
    previewText:
      "Good morning Leadership Team. Your autonomous weekly briefing is ready. Blended gross margin finished at 82.4% (+2.4% above plan), and Net Dollar Retention reached 124.0%. Attached is the verified multi-tab Excel model.",
    metrics: [
      { label: "Gross ARR Run-Rate", val: "$1,420,000", change: "+13.6% vs Plan" },
      { label: "Blended Gross Margin", val: "82.4%", change: "+2.4% vs Plan" },
      { label: "Net Dollar Retention", val: "124.0%", change: "Top Quartile" },
    ],
    attachment: "DataInsight_Consolidated_Exec_Model_2025.xlsx",
  },
  {
    id: "monthly",
    title: "End-of-Month Financial Close",
    cadence: "Monthly on the 1st at 06:00 AM UTC",
    recipients: "Corporate Finance & FP&A Leadership",
    channel: "Consolidated P&L Pack + Living Excel Formulas",
    subject: "Monthly Financial Close: Variance Analysis & Predictive Forecasts",
    previewText:
      "All 12-month cohort ledgers have been reconciled deterministically in Supabase. Q4 revenue is projected at $482,000 with a 95% statistical confidence interval ($464k - $501k). Zero formula discrepancies found across 24,500 transactions.",
    metrics: [
      { label: "Total Period GMV", val: "$8,840,000", change: "+18.2% YoY" },
      { label: "Burn Multiple", val: "0.68x", change: "Capital Efficient" },
      { label: "Q4 Linear Projection", val: "$482,000", change: "95% CI Verified" },
    ],
    attachment: "Monthly_Close_Audited_Workbook_Oct2025.xlsx",
  },
  {
    id: "anomaly",
    title: "Real-Time 1.7σ Anomaly Alert",
    cadence: "Trigger-based on 1.7σ statistical deviation",
    recipients: "Data Ops, Head of Finance, Slack #alerts-revenue",
    channel: "Slack Webhook + Priority Email Notification",
    subject: "ANOMALY ALERT: 1.7σ Revenue Variance Flagged in Month 07",
    previewText:
      "Autonomous cleansing isolated an unexpected surge in Month 07 ($148,000 vs $112,000 baseline). Root cause verified: Early multi-year contract renewals from 3 enterprise accounts. Anomaly isolated with audit trail preserved.",
    metrics: [
      { label: "Detected Outlier", val: "$148,000", change: "Month 07 Spike" },
      { label: "Variance Deviation", val: "1.74σ", change: "Standard Dev" },
      { label: "Data Integrity", val: "100.0%", change: "Audit Signed" },
    ],
    attachment: "Anomaly_RootCause_Audit_Log_M07.xlsx",
  },
]

export function ScheduledReportsSection() {
  const [activeCadenceId, setActiveCadenceId] = useState<string>("monday")

  const current =
    SCHEDULE_CADENCES.find((c) => c.id === activeCadenceId) ||
    SCHEDULE_CADENCES[0]

  return (
    <section id="dispatch" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* ── SECTION HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Automated Scheduled Delivery.{" "}
            <span className="text-emerald-600">Zero Human Reminders.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Data Insight compiles, formats, verifies, and delivers executive intelligence digests and multi-tab Excel
            workbooks directly to board members and Slack channels on schedule.
          </p>
        </motion.div>

        {/* ── INTERACTIVE CADENCE SELECTOR & LIVE DISPATCH PREVIEW ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Cadence Selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Select Automated Dispatch Cadence
            </span>

            {SCHEDULE_CADENCES.map((c) => {
              const isSelected = activeCadenceId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCadenceId(c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col space-y-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-white border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-bold ${isSelected ? "text-slate-950" : "text-slate-700"}`}>
                      {c.title}
                    </span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-mono font-medium">
                    {c.cadence}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Channel: {c.channel.split("+")[0]}
                  </span>
                </button>
              )
            })}
          </motion.div>

          {/* Live Delivery Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col justify-between"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Email Client Header */}
                <div className="space-y-3 pb-5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-slate-900">Scheduled Dispatch Engine</span>
                    </div>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      {current.cadence}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 font-medium w-16 shrink-0">Subject:</span>
                      <span className="font-bold text-slate-950">{current.subject}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 font-medium w-16 shrink-0">Recipients:</span>
                      <span className="text-slate-600 font-mono text-[11px]">{current.recipients}</span>
                    </div>
                  </div>
                </div>

                {/* Email Synthesis Body */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
                  <p>{current.previewText}</p>

                  {/* Highlighted Executive Metrics Strip */}
                  <div className="grid sm:grid-cols-3 gap-3 pt-2">
                    {current.metrics.map((m) => (
                      <div key={m.label} className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">{m.label}</span>
                        <span className="text-sm sm:text-base font-extrabold text-slate-950 block">{m.val}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">{m.change}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attached Living Excel Workbook Tag */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      XLS
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{current.attachment}</span>
                      <span className="text-[10px] text-slate-500">Native formulas with =SUM, =AVERAGE, =FORECAST</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-200 font-semibold shadow-2xs">
                    Auto-Attached
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

        </div>

      </div>
    </section>
  )
}
