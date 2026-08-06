"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileSpreadsheet,
  Download,
  Layers,
  Code2,
  Table,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { REAL_DATASETS, generateRealExcelWorkbook } from "@/lib/landingDataEngine"

const EXCEL_TABS = [
  {
    id: "exec",
    name: "01_Executive_Summary.sheet",
    formula: '=GETPIVOTDATA("Revenue", $A$1, "Period", "Q3_Consolidated")',
  },
  {
    id: "model",
    name: "02_Financial_Model_Formulas.sheet",
    formula: "=SUM(C2:C13) * (1 + Annual_Expansion_Rate)",
  },
  {
    id: "forecast",
    name: "03_Predictive_Horizon_Q4.sheet",
    formula: "=FORECAST.LINEAR(A14, B2:B13, A2:A13)",
  },
]

const EXEC_ROWS = [
  { metric: "Gross Annual Run Rate (ARR)", actual: "$1,420,000", plan: "$1,250,000", variance: "+13.6%", status: "Exceeded Target", formula: "=(B2-C2)/C2" },
  { metric: "Blended Gross Margin", actual: "82.4%", plan: "80.0%", variance: "+2.4%", status: "Optimal", formula: "=B3-C3" },
  { metric: "Net Dollar Retention (NDR)", actual: "124.0%", plan: "115.0%", variance: "+9.0%", status: "Top Quartile", formula: "=B4/C4" },
  { metric: "Customer Acquisition Cost (CAC)", actual: "$4,200", plan: "$4,800", variance: "-12.5%", status: "Efficient", formula: "=(B5-C5)/C5" },
  { metric: "Sales Efficiency (Magic Number)", actual: "1.42x", plan: "1.10x", variance: "+0.32x", status: "High Velocity", formula: "=(B6*4)/C6" },
  { metric: "Burn Multiple Ratio", actual: "0.68x", plan: "0.90x", variance: "-24.4%", status: "Capital Efficient", formula: "=B7/C7" },
]

const FORECAST_ROWS = [
  { horizon: "Month 13 (Q4 M1)", baseline: "$156,400", lower: "$149,800", upper: "$163,000", conf: "95.0%", formula: "=FORECAST.LINEAR(A14,B2:B13,A2:A13)" },
  { horizon: "Month 14 (Q4 M2)", baseline: "$162,800", lower: "$154,200", upper: "$171,400", conf: "95.0%", formula: "=FORECAST.LINEAR(A15,B2:B13,A2:A13)" },
  { horizon: "Month 15 (Q4 M3)", baseline: "$169,500", lower: "$158,900", upper: "$180,100", conf: "95.0%", formula: "=FORECAST.LINEAR(A16,B2:B13,A2:A13)" },
  { horizon: "Month 16 (Q1 M1)", baseline: "$176,300", lower: "$163,500", upper: "$189,100", conf: "95.0%", formula: "=FORECAST.LINEAR(A17,B2:B13,A2:A13)" },
  { horizon: "Month 17 (Q1 M2)", baseline: "$183,400", lower: "$168,200", upper: "$198,600", conf: "95.0%", formula: "=FORECAST.LINEAR(A18,B2:B13,A2:A13)" },
  { horizon: "Month 18 (Q1 M3)", baseline: "$190,800", lower: "$173,000", upper: "$208,600", conf: "95.0%", formula: "=FORECAST.LINEAR(A19,B2:B13,A2:A13)" },
]

export function ExcelSection() {
  const [activeTab, setActiveTab] = useState<string>("model")
  const profile = REAL_DATASETS.saas
  const currency = profile.currency

  const currentTabObj = EXCEL_TABS.find((t) => t.id === activeTab) || EXCEL_TABS[1]

  return (
    <section id="excel-studio" className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-slate-200 overflow-hidden">
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
            Native Multi-Tab Excel.{" "}
            <span className="text-emerald-600">With Living Formulas.</span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Unlike other AI tools that export dead static CSV text, Data Insight builds authentic,
            multi-tab Microsoft Excel workbooks formatted with real <code className="text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">=SUM()</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">=AVERAGE()</code>, and custom brand palettes.
          </p>
        </motion.div>

        {/* ── INTERACTIVE WORKBOOK VIEWER WITH SMOOTH REVEAL ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden transition-all"
        >
          
          {/* Excel Application Titlebar */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                XLS
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-slate-900">
                  DataInsight_Enterprise_Model_2025.xlsx
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Office 2003 XML / SpreadsheetML Native Format
                </span>
              </div>
            </div>

            <Button
              onClick={() => generateRealExcelWorkbook(profile)}
              size="sm"
              className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1.5 h-8 shadow-xs whitespace-nowrap inline-flex items-center transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Download Live Excel File</span>
            </Button>
          </div>

          {/* Excel Formula Bar */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-200 bg-white text-xs font-mono">
            <span className="font-bold text-slate-500">fx</span>
            <span className="h-4 w-px bg-slate-200" />
            <motion.span
              key={currentTabObj.formula}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="text-emerald-700 font-semibold"
            >
              {currentTabObj.formula}
            </motion.span>
            <span className="text-slate-400 ml-auto hidden sm:inline text-[11px]">Formula Evaluation: Native</span>
          </div>

          {/* Spreadsheet Table View (Silky AnimatePresence on Tab Switch) */}
          <div className="p-4 sm:p-6 overflow-x-auto bg-white min-h-[380px]">
            <AnimatePresence mode="wait">
              {activeTab === "exec" && (
                <motion.div
                  key="exec"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-[#0A3A2A] text-white text-xs">
                        <th className="py-2.5 px-4 font-bold border border-[#0A3A2A]">Row</th>
                        <th className="py-2.5 px-4 font-bold border border-[#0A3A2A]">Executive KPI Line Item</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Q3 Actual</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Q3 Target</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Variance</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Executive Status</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Excel Formula</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {EXEC_ROWS.map((row, idx) => (
                        <motion.tr
                          key={row.metric}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          className={`transition-colors hover:bg-emerald-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}
                        >
                          <td className="py-2 px-4 text-slate-400 font-bold border border-slate-200 text-[11px]">{idx + 2}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900 border border-slate-200">{row.metric}</td>
                          <td className="py-2 px-4 text-right font-medium text-emerald-700 border border-slate-200">{row.actual}</td>
                          <td className="py-2 px-4 text-right text-slate-700 border border-slate-200">{row.plan}</td>
                          <td className="py-2 px-4 text-right font-bold text-emerald-700 border border-slate-200">{row.variance}</td>
                          <td className="py-2 px-4 text-right text-slate-900 border border-slate-200">{row.status}</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-500 border border-slate-200 text-[11px]">{row.formula}</td>
                        </motion.tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold text-slate-900 border-2 border-emerald-500">
                        <td className="py-2.5 px-4 text-emerald-800 border border-emerald-200">8</td>
                        <td className="py-2.5 px-4 text-emerald-900 border border-emerald-200">EXECUTIVE SCORECARD</td>
                        <td className="py-2.5 px-4 text-right text-emerald-800 border border-emerald-200">100% Verified</td>
                        <td className="py-2.5 px-4 text-right border border-emerald-200">100% Plan</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 border border-emerald-200">+10.2% avg</td>
                        <td className="py-2.5 px-4 text-right border border-emerald-200">Audit Passed</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-mono border border-emerald-200">=AVERAGE(E2:E7)</td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === "model" && (
                <motion.div
                  key="model"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-[#0A3A2A] text-white text-xs">
                        <th className="py-2.5 px-4 font-bold border border-[#0A3A2A]">Row</th>
                        <th className="py-2.5 px-4 font-bold border border-[#0A3A2A]">Period / Cohort</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Revenue ({currency})</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Gross Margin</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Active Customers</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Excel Formula Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {profile.rows.slice(0, 8).map((row, idx) => (
                        <motion.tr
                          key={row.period}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          className={`transition-colors hover:bg-emerald-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}
                        >
                          <td className="py-2 px-4 text-slate-400 font-bold border border-slate-200 text-[11px]">{idx + 2}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900 border border-slate-200">{row.period}</td>
                          <td className="py-2 px-4 text-right font-medium text-emerald-700 border border-slate-200">
                            {row.revenue.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-700 border border-slate-200">{row.margin}%</td>
                          <td className="py-2 px-4 text-right text-slate-700 border border-slate-200">{row.ordersOrUsers.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-500 border border-slate-200 text-[11px]">
                            =C{idx + 2}*D{idx + 2}
                          </td>
                        </motion.tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold text-slate-900 border-2 border-emerald-500">
                        <td className="py-2.5 px-4 text-emerald-800 border border-emerald-200">14</td>
                        <td className="py-2.5 px-4 text-emerald-900 border border-emerald-200">SUM TOTAL</td>
                        <td className="py-2.5 px-4 text-right text-emerald-800 border border-emerald-200">
                          {currency}{profile.totalRevenue.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right border border-emerald-200">{profile.avgMargin}% avg</td>
                        <td className="py-2.5 px-4 text-right border border-emerald-200">
                          {profile.rows.reduce((a, b) => a + b.ordersOrUsers, 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-mono border border-emerald-200">
                          =SUM(C2:C13)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === "forecast" && (
                <motion.div
                  key="forecast"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-[#0A3A2A] text-white text-xs">
                        <th className="py-2.5 px-4 font-bold border border-[#0A3A2A]">Row</th>
                        <th className="py-2.5 px-4 font-bold border border-[#0A3A2A]">Predictive Horizon</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Linear Trend Baseline</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Lower 95% Bound</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Upper 95% Bound</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Confidence</th>
                        <th className="py-2.5 px-4 font-bold text-right border border-[#0A3A2A]">Regression Formula</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {FORECAST_ROWS.map((row, idx) => (
                        <motion.tr
                          key={row.horizon}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03, duration: 0.2 }}
                          className={`transition-colors hover:bg-emerald-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}
                        >
                          <td className="py-2 px-4 text-slate-400 font-bold border border-slate-200 text-[11px]">{idx + 14}</td>
                          <td className="py-2 px-4 font-semibold text-slate-900 border border-slate-200">{row.horizon}</td>
                          <td className="py-2 px-4 text-right font-medium text-emerald-700 border border-slate-200">{row.baseline}</td>
                          <td className="py-2 px-4 text-right text-slate-600 border border-slate-200">{row.lower}</td>
                          <td className="py-2 px-4 text-right text-slate-600 border border-slate-200">{row.upper}</td>
                          <td className="py-2 px-4 text-right font-bold text-emerald-700 border border-slate-200">{row.conf}</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-500 border border-slate-200 text-[11px]">{row.formula}</td>
                        </motion.tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold text-slate-900 border-2 border-emerald-500">
                        <td className="py-2.5 px-4 text-emerald-800 border border-emerald-200">20</td>
                        <td className="py-2.5 px-4 text-emerald-900 border border-emerald-200">PROJECTED RUN-RATE</td>
                        <td className="py-2.5 px-4 text-right text-emerald-800 border border-emerald-200">$1,039,200</td>
                        <td className="py-2.5 px-4 text-right border border-emerald-200">$967,600</td>
                        <td className="py-2.5 px-4 text-right border border-emerald-200">$1,110,800</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 border border-emerald-200">95.0% CI</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-mono border border-emerald-200">=SUM(C14:C19)</td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Excel Bottom Worksheet Tabs with Smooth Sliding Layout Indicator */}
          <div className="flex items-center gap-1 px-4 py-2 border-t border-slate-200 bg-slate-100 overflow-x-auto text-xs">
            {EXCEL_TABS.map((t) => {
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative px-3.5 py-1.5 rounded-t font-mono font-medium border-t border-x transition-colors cursor-pointer ${
                    isActive
                      ? "bg-white border-slate-300 text-slate-900 font-bold shadow-xs"
                      : "bg-slate-200/70 border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeExcelWorksheetIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {t.name}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ── 3 ENTERPRISE SPREADSHEET CAPABILITIES WITH SMOOTH STAGGER & HOVER LIFT ── */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Code2,
              title: "Live Formula Injection",
              desc: "Formulas are embedded directly into cell elements. When you tweak an assumption in Excel, your entire model recalculates dynamically.",
            },
            {
              icon: Layers,
              title: "Multi-Tab Architecture",
              desc: "Separates raw data, KPI dashboards, financial modeling, and predictive forecasts into cleanly organized, professional worksheets.",
            },
            {
              icon: Table,
              title: "Executive Styling",
              desc: "Auto-formats currency, percentages, bold totals, zebra shading, and dark forest headers ready for CFO and board presentations.",
            },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
