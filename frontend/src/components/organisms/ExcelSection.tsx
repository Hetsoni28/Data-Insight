"use client"
import React, { useState } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { BarChart3, FileText, AlertTriangle, ChevronRight, Bot, TrendingUp, TrendingDown, Target, Zap, Download } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.12 } } }

const FEATURES = [
  { icon: BarChart3, title: "Executive Dashboard", desc: "High-quality KPI capabilities and AI-ready summary that communicate value to the C-Suite.", tooltip: "Auto-generated with your branding colors" },
  { icon: FileText, title: "AI Narrative Sheet", desc: "Provides narrative interpretation to help surface and address business performance.", tooltip: "Uses GPT-4 to write the narrative for you" },
  { icon: AlertTriangle, title: "Risk & Anomaly Report", desc: "Automatic flagging of statistical outliers and potential business risk opportunities.", tooltip: "Alerts delivered via email or Slack" },
]

const TABS = ["Dashboard", "KPIs", "Forecast", "Anomalies", "Narrative"]

const TABLE_ROWS = [
  ["Revenue", "$780K", "$820K", "$940K", "▲"],
  ["Gross Margin", "42%", "44%", "47%", "▲"],
  ["Churn Rate", "2.1%", "1.8%", "1.5%", "▼"],
  ["New Clients", "12", "15", "19", "▲"],
  ["NPS Score", "62", "67", "71", "▲"],
]

export function ExcelSection() {
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 1500)
  }

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50/60 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left copy */}
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }} variants={stagger} className="space-y-6"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            The AI Excel Generator
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
            Our generator engine doesn&apos;t just fill cells. It builds a real workbook — every page AI-ready, formatted to impress stakeholders.
          </motion.p>
          <motion.div variants={stagger} className="space-y-5">
            {FEATURES.map((item) => {
              const Icon = item.icon
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="h-9 w-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0 cursor-help">
                        <Icon className="h-4 w-4 text-[#10B981]" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{item.tooltip}</TooltipContent>
                  </Tooltip>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
          <motion.div variants={fadeUp}>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className={cn(buttonVariants({ size: "default" }), "bg-[#10B981] hover:bg-[#059669] text-white px-6 text-sm shadow-md gap-2 justify-center transition-all disabled:opacity-80")}
            >
              {isGenerating ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap className="h-3.5 w-3.5" /></motion.div> Generating Workbook...</>
              ) : (
                <>Try AI Excel Generator <Download className="h-3.5 w-3.5" /></>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Right — spreadsheet mockup */}
        <motion.div
          initial={{ opacity: 0, x: 48 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }}
        >
          <div className="rounded-2xl border-2 border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden bg-white dark:bg-transparent flex flex-col h-[360px] sm:h-[400px]">
            {/* Window Header */}
            <div className="bg-slate-100 dark:bg-white/10 border-b flex items-center gap-1.5 px-4 py-2.5 shrink-0">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <div className="ml-3 text-[10px] text-slate-400 font-medium">AI_Report_Q3_Final.xlsx</div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-b px-1 sm:px-2 flex gap-0 sm:gap-1 overflow-x-auto shrink-0 custom-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[9px] sm:text-[10px] px-2 sm:px-4 py-2 font-medium cursor-pointer whitespace-nowrap transition-colors relative ${activeTab === tab ? "text-[#10B981]" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-t-md"}`}
                >
                  {activeTab === tab && (
                    <motion.div layoutId="excel-tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10B981]" />
                  )}
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar relative bg-white dark:bg-transparent">
              <AnimatePresence mode="wait">
                {activeTab === "Dashboard" && (
                  <motion.div key="Dashboard" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="space-y-2">
                    {/* Horizontally scrollable on mobile so the 5-col table never squishes */}
                    <div className="overflow-x-auto -mx-1">
                      <div className="min-w-[320px] px-1">
                        <div className="grid grid-cols-5 gap-px bg-slate-100 dark:bg-white/10 text-[9px] font-semibold text-slate-500 dark:text-slate-400 rounded-t-sm overflow-hidden border">
                          {["METRIC", "JAN", "FEB", "MAR", "TREND"].map(h => (
                            <div key={h} className="bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5 whitespace-nowrap">{h}</div>
                          ))}
                        </div>
                        <div className="border rounded-b-sm overflow-hidden">
                          {TABLE_ROWS.map((row, ri) => (
                            <div key={ri} className={`grid grid-cols-5 gap-px text-[9px] ${ri % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-slate-50/60"}`}>
                              <div className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{row[0]}</div>
                              {row.slice(1, 4).map((cell, ci) => <div key={ci} className="px-2 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{cell}</div>)}
                              <div className={`px-2 py-2 font-bold ${row[4] === "▲" ? "text-emerald-600" : "text-red-500"}`}>{row[4]}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 p-3 flex items-start gap-3 shadow-sm">
                      <Bot className="h-4 w-4 text-[#10B981] mt-0.5 shrink-0" />
                      <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-[#10B981]">AI Summary:</span> Revenue accelerated 14.6% in March driven by enterprise upsells. Churn is declining steadily, suggesting that the Q4 forecast will be exceeded by an estimated $120K.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "KPIs" && (
                  <motion.div key="KPIs" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="grid grid-cols-2 gap-3 h-full">
                    {[
                      { title: "Total Revenue", val: "$2.54M", trend: "+14%", icon: Target, up: true },
                      { title: "Active Enterprise", val: "142", trend: "+8", icon: BarChart3, up: true },
                      { title: "Net Revenue Retention", val: "112%", trend: "+2%", icon: TrendingUp, up: true },
                      { title: "Customer Acq. Cost", val: "$4,250", trend: "-$120", icon: TrendingDown, up: false } // lower is better, marked up: false but trend is green
                    ].map((kpi, i) => (
                      <div key={i} className="border border-slate-100 dark:border-white/5 shadow-sm rounded-xl p-3 flex flex-col justify-between bg-gradient-to-b from-white to-slate-50/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                          <kpi.icon className="h-3.5 w-3.5 text-slate-300" />
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{kpi.val}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${kpi.trend.includes('-') && kpi.up === false ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {kpi.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === "Forecast" && (
                  <motion.div key="Forecast" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Q4 ARR Trajectory</span>
                      <span className="text-[9px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full font-medium">96% Confidence</span>
                    </div>
                    <div className="flex-1 -mx-2">
                      <ReactECharts
                        option={{
                          grid: { top: 10, right: 10, bottom: 20, left: 35 },
                          tooltip: { trigger: 'axis', textStyle: { fontSize: 10 } },
                          xAxis: { type: 'category', data: ['Oct', 'Nov', 'Dec'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 9, color: '#94a3b8' } },
                          yAxis: { type: 'value', min: 800, max: 1200, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { fontSize: 9, color: '#94a3b8', formatter: '${value}K' } },
                          series: [
                            {
                              name: 'Projected',
                              data: [850, 980, 1150],
                              type: 'line',
                              smooth: true,
                              itemStyle: { color: '#10B981' },
                              areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } },
                              lineStyle: { width: 3 }
                            }
                          ]
                        }}
                        style={{ height: '100%', minHeight: 180, minWidth: 200, width: '100%' }}
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === "Anomalies" && (
                  <motion.div key="Anomalies" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="space-y-3">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-[10px] font-bold text-red-800">Critical Anomaly Detected</span>
                      </div>
                      <p className="text-[10px] text-red-600/90 leading-relaxed">
                        API usage for &quot;Enterprise Plan&quot; users dropped by 45% between Mar 12 and Mar 14. This is a 3-sigma deviation from the historical rolling average.
                      </p>
                    </div>
                    <div className="border border-slate-100 dark:border-white/5 rounded-lg p-3 shadow-sm bg-white dark:bg-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Recommended Actions</span>
                      </div>
                      <ul className="text-[9px] text-slate-600 dark:text-slate-400 space-y-2">
                        <li className="flex gap-2 items-start"><span className="text-[#10B981] font-bold">1.</span> Verify if there was a scheduled maintenance window affecting API gateways.</li>
                        <li className="flex gap-2 items-start"><span className="text-[#10B981] font-bold">2.</span> Check integration logs for top 5 enterprise clients.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === "Narrative" && (
                  <motion.div key="Narrative" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="prose prose-sm prose-slate max-w-none h-full bg-[#fcfcfc] p-4 rounded border border-slate-100 dark:border-white/5 shadow-inner overflow-y-auto text-[10px]">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 font-serif">Quarterly Business Review - Executive Summary</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                      Q1 demonstrated robust financial health, with total revenue closing at <strong>$2.54M</strong>, outpacing our initial target by 14%. This growth was primarily driven by the successful launch of the new AI automation features, which accounted for a 35% increase in upsells among the existing enterprise cohort.
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      However, customer acquisition costs (CAC) saw a temporary spike in February due to the experimental ad campaigns in the EMEA region. The AI models suggest reallocating 20% of the EMEA budget toward North American inbound channels could yield a <strong>4.2x ROI</strong> by Q3.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
