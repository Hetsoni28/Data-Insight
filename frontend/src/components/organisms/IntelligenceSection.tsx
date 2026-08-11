"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare,
  Sparkles,
  Search,
  Database,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Bot,
  Send,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const SAMPLE_QUERIES = [
  {
    q: "Which cohort had the highest expansion velocity and gross margin in Q3?",
    answer:
      "Enterprise Tier accounts drove +38.4% ARR expansion in Q3 with an average gross margin of 84.2%, outperforming SMB cohorts by 1.8x.",
    metric: "+38.4% ARR",
    metricLabel: "Enterprise Expansion",
  },
  {
    q: "Are there any statistically significant revenue anomalies in the last 12 months?",
    answer:
      "Detected 1 outlier in Month 07 (Revenue $148,000, 1.7σ deviation from mean), primarily driven by early multi-year contract renewals.",
    metric: "1.7σ Variance",
    metricLabel: "Month 07 Outlier",
  },
  {
    q: "Forecast our Q4 revenue based on current linear momentum and churn trajectory.",
    answer:
      "Q4 run-rate is projected at $482,000 (95% CI: $464,000 - $501,000), assuming current retention baseline of 94.8% persists.",
    metric: "$482,000",
    metricLabel: "Projected Q4 Target",
  },
]

const CONNECTORS = [
  { name: "PostgreSQL", type: "Relational DB", latency: "< 24ms", active: true },
  { name: "Snowflake", type: "Data Warehouse", latency: "< 80ms", active: true },
  { name: "Google BigQuery", type: "Data Lake", latency: "< 65ms", active: true },
  { name: "Microsoft Excel", type: "Spreadsheets", latency: "Instant", active: true },
  { name: "Amazon Redshift", type: "Warehouse", latency: "< 90ms", active: true },
  { name: "Stripe Billing", type: "API Webhook", latency: "< 15ms", active: true },
]

export function IntelligenceSection() {
  const [selectedIdx, setSelectedIdx] = useState<number>(0)
  const [customInput, setCustomInput] = useState<string>("")
  const [activeDisplay, setActiveDisplay] = useState(SAMPLE_QUERIES[0])

  const handleAsk = (query: string, item?: typeof SAMPLE_QUERIES[0]) => {
    if (item) {
      setActiveDisplay(item)
    } else {
      setActiveDisplay({
        q: query,
        answer: `Analyzed query across multi-dimensional metrics. Total verified throughput matches live regression baseline with zero discrepancy.`,
        metric: "100% Math Match",
        metricLabel: "Verified Calculation",
      })
    }
  }

  return (
    <section id="copilot" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* ── SECTION HEADER WITH VIEWPORT REVEAL ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Ask Any Question.{" "}
            <span className="text-emerald-600">Get Verified Board-Ready Proof.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Data Insight translates conversational executive questions into deterministic SQL &amp;
            financial aggregations. Never guess what caused a dip or surge.
          </p>
        </motion.div>

        {/* ── INTERACTIVE COPILOT CHAT EXPERIENCE ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Query Suggestion Pills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 space-y-3"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Select or Click Sample Queries
            </span>
            {SAMPLE_QUERIES.map((sq, idx) => {
              const isSelected = activeDisplay.q === sq.q
              return (
                <motion.button
                  key={sq.q}
                  onClick={() => {
                    setSelectedIdx(idx)
                    handleAsk(sq.q, sq)
                  }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-white border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <MessageSquare
                    className={`h-4 w-4 shrink-0 mt-0.5 transition-colors ${
                      isSelected ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-relaxed ${isSelected ? "text-slate-950 font-semibold" : "text-slate-700"}`}>
                      &quot;{sq.q}&quot;
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      Target: {sq.metricLabel}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>

          {/* Interactive Copilot Console */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col justify-between"
          >
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Data Insight AI Copilot
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Deterministic Math &amp; Executive Synthesis
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Body with Silky AnimatePresence */}
            <div className="p-6 space-y-6 min-h-[260px] bg-white">
              
              {/* User Question Bubble */}
              <div className="flex items-start gap-3 max-w-xl">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                  You
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-100 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-xs">
                  {activeDisplay.q}
                </div>
              </div>

              {/* AI Copilot Answer Bubble */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDisplay.q}
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 max-w-2xl"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm shadow-emerald-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-emerald-50/70 border border-emerald-200 text-slate-900 text-xs sm:text-sm leading-relaxed shadow-xs">
                      {activeDisplay.answer}
                    </div>

                    {/* Calculated Proof Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">{activeDisplay.metricLabel}</span>
                          <span className="text-sm font-extrabold text-slate-950">{activeDisplay.metric}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        100% Deterministic Fact
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

            </div>

            {/* Interactive Query Input */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!customInput.trim()) return
                  handleAsk(customInput)
                  setCustomInput("")
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a question about your revenue, churn, margins, or forecasts..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-4 rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  <span>Execute</span>
                </Button>
              </form>
            </div>

          </motion.div>

        </div>

        {/* ── LIVE DATA CONNECTORS WITH VIEWPORT REVEAL & HOVER LIFT ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 pt-4"
        >
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Native Relational, Warehouse &amp; API Connectors
            </h3>
            <p className="text-xs text-slate-500">
              Ingest from your production data stack with sub-second query latency and zero-config ETL.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CONNECTORS.map((c, idx) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all text-center space-y-1"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900">{c.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">{c.type}</span>
                <span className="text-[10px] text-emerald-700 font-mono font-medium block">{c.latency}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
