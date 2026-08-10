"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Database,
  Calculator,
  LineChart,
  FileSpreadsheet,
  Send,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Code2,
} from "lucide-react"

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Instant Ingestion & Schema Discovery",
    desc: "Ingests CSV, XLSX, SQL, and API payloads in milliseconds without rigid ETL setups.",
    tech: "Dynamic Type Coercion & Zero-Config Parsing",
    icon: Database,
    telemetry: "24,500 records parsed in 18ms",
    verification: "Schema types validated against ANSI SQL standards",
    specs: [
      { label: "Throughput", val: "1.2M rows/sec" },
      { label: "Parser", val: "Rust SIMD engine" },
      { label: "Schema Validation", val: "100% strict" },
    ],
  },
  {
    step: "02",
    title: "1.7σ Anomaly & Outlier Cleansing",
    desc: "Calculates statistical standard deviations to identify and isolate data variances automatically.",
    tech: "Z-Score Variance Isolation Engine",
    icon: Cpu,
    telemetry: "1.7σ deviation detected across Month 07 cohorts",
    verification: "Variance quarantined with audit logs preserved",
    specs: [
      { label: "Threshold", val: "1.7σ Gaussian" },
      { label: "Quarantine", val: "Non-destructive" },
      { label: "Audit Trace", val: "Immutable" },
    ],
  },
  {
    step: "03",
    title: "Deterministic Formula Computation",
    desc: "Calculates live KPIs, burn rates, margins, and cohort run-rates with zero hallucination.",
    tech: "Native Math & Financial Aggregation Matrix",
    icon: Calculator,
    telemetry: "Gross ARR & blended margin computed to 4 decimal precision",
    verification: "Zero LLM hallucination risk in numerical calculations",
    specs: [
      { label: "Math Engine", val: "Deterministic" },
      { label: "Float Precision", val: "IEEE 754 64-bit" },
      { label: "Accuracy", val: "100.000%" },
    ],
  },
  {
    step: "04",
    title: "Algorithmic Predictive Forecasting",
    desc: "Fits linear regression models with 95% confidence intervals across forward quarters.",
    tech: "Least-Squares Trendline Horizon Modeling",
    icon: LineChart,
    telemetry: "Forward 6-month run-rate calculated with 95% CI bounds",
    verification: "R² goodness-of-fit evaluated at 0.942",
    specs: [
      { label: "Algorithm", val: "Least-Squares" },
      { label: "Confidence", val: "95% CI Bands" },
      { label: "Horizon", val: "6-12 Months" },
    ],
  },
  {
    step: "05",
    title: "Formula-Native Excel Compilation",
    desc: "Generates genuine multi-tab SpreadsheetML workbooks with living =SUM and =AVERAGE formulas.",
    tech: "Microsoft SpreadsheetML XML Compiler",
    icon: FileSpreadsheet,
    telemetry: "Multi-tab .xlsx workbook compiled with active =SUM() formulas",
    verification: "Fully editable across Microsoft Excel and Google Sheets",
    specs: [
      { label: "Format", val: "SpreadsheetML" },
      { label: "Formulas", val: "Native Excel" },
      { label: "Palettes", val: "Custom Brand" },
    ],
  },
  {
    step: "06",
    title: "Executive Synthesis & Delivery",
    desc: "Summarizes actionable strategic takeaways for founders, CFOs, and board members.",
    tech: "Executive Briefing Generation Engine",
    icon: Send,
    telemetry: "Board deck briefing and strategic action checklist delivered",
    verification: "Deterministic facts synthesized into natural language",
    specs: [
      { label: "Audience", val: "Board & CFO" },
      { label: "Delivery", val: "Real-time" },
      { label: "Integrations", val: "Slack & Email" },
    ],
  },
]

const COMPARISON_DATA = [
  {
    category: "Setup & Integration",
    legacy: "Weeks of manual SQL pipelines, dbt models, and schema mapping",
    dataInsight: "Instant drag-and-drop or 1-click database connection with auto-schema",
  },
  {
    category: "Report Generation",
    legacy: "4-8 hours weekly manually updating spreadsheets and PowerPoint slides",
    dataInsight: "Autonomous execution in seconds with living Excel formulas",
  },
  {
    category: "Predictive Forecasting",
    legacy: "Static historical charts requiring dedicated data science modeling",
    dataInsight: "Real-time regression trendlines with 95% statistical confidence bounds",
  },
  {
    category: "Data Reliability",
    legacy: "Broken VLOOKUPs, formula copy-paste errors, and silent hallucinations",
    dataInsight: "100% deterministic mathematical computation and automated anomaly flags",
  },
  {
    category: "Executive Excel Output",
    legacy: "Flat CSV export without styling, colors, or formulas",
    dataInsight: "Multi-tab styled Excel workbook with live formulas (=SUM, =AVERAGE)",
  },
]

export function StopReportingSection() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* ── SECTION HEADER WITH VIEWPORT ANIMATION ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Stop Building Reports Manually.{" "}
            <span className="text-emerald-600">Let Autonomous AI Execute.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Data Insight operates as a 24/7 senior business intelligence team. It ingests,
            cleanses, computes, forecasts, and compiles polished board decks without human latency.
          </p>
        </motion.div>

        {/* ── 6-STAGE AUTONOMOUS PIPELINE SCRUBBER (BALANCED EQUAL-HEIGHT BOXES WITH SMOOTH MOTION) ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Step Selector List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col justify-between space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Autonomous 6-Stage Execution Pipeline
            </h3>
            {PIPELINE_STEPS.map((item, idx) => {
              const isSelected = activeStepIndex === idx
              return (
                <motion.button
                  key={item.step}
                  onClick={() => setActiveStepIndex(idx)}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                    isSelected
                      ? "bg-white border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 font-mono font-bold text-xs transition-colors ${
                      isSelected
                        ? "bg-[#10B981] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-bold transition-colors ${isSelected ? "text-slate-950" : "text-slate-700"}`}>
                        {item.title}
                      </span>
                      {isSelected && <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>

          {/* Right: Detailed Stage Preview Card (Matches Full Height of Left Column) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 h-full flex flex-col"
          >
            <AnimatePresence mode="wait">
              {(() => {
                const current = PIPELINE_STEPS[activeStepIndex]
                const Icon = current.icon
                return (
                  <motion.div
                    key={current.step}
                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.99 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col justify-between space-y-6"
                  >
                    {/* Header */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-xs font-mono font-bold text-emerald-700">
                              STAGE {current.step} OF 06
                            </span>
                            <h4 className="text-lg sm:text-xl font-bold text-slate-900">{current.title}</h4>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed">{current.desc}</p>
                    </div>

                    {/* Architecture Engine Specs */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Underlying Engine Architecture
                      </span>
                      <div className="font-mono text-xs text-emerald-800 font-semibold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {current.tech}
                      </div>
                      <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-200 text-xs">
                        {current.specs.map((spec) => (
                          <div key={spec.label} className="p-2 rounded bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">{spec.label}</span>
                            <span className="font-bold text-slate-900 text-xs">{spec.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Live Execution Telemetry & Deterministic Verification */}
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-950 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{current.telemetry}</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">Live Telemetry</span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                        <div className="flex items-center gap-2 font-medium">
                          <ShieldCheck className="h-4 w-4 text-slate-600 shrink-0" />
                          <span>{current.verification}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">Verified</span>
                      </div>
                    </div>

                  </motion.div>
                )
              })()}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── HIGH-FIDELITY COMPARISON MATRIX WITH VIEWPORT ANIMATION ── */}
        <motion.div
          id="comparison"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pt-12 space-y-6"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">
              Legacy BI vs. Data Insight Autonomous Architecture
            </h3>
            <p className="text-xs text-slate-500">
              Why modern data teams and CFOs are replacing manual dashboarding workflows.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-6 font-bold text-slate-600 bg-slate-50 w-1/4">
                    Evaluation Metric
                  </th>
                  <th className="py-4 px-6 font-bold text-rose-700 bg-rose-50/50 w-3/8">
                    Legacy BI (Tableau, PowerBI, Excel)
                  </th>
                  <th className="py-4 px-6 font-bold text-emerald-900 bg-emerald-50 w-3/8 border-l border-emerald-200">
                    Data Insight (Autonomous AI Studio)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_DATA.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-slate-800 bg-slate-50/30">
                      {row.category}
                    </td>
                    <td className="py-4 px-6 text-slate-600 flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{row.legacy}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-900 font-medium bg-emerald-50/20 border-l border-emerald-100">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{row.dataInsight}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
