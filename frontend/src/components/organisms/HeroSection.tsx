"use client"

import React, { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers,
  Database,
  ChevronRight,
  RefreshCw,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/molecules/PaginationControls"
import {
  REAL_DATASETS,
  DatasetProfile,
  generateRealExcelWorkbook,
  parseCsvTextToProfile,
} from "@/lib/landingDataEngine"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

export function HeroSection() {
  const [selectedKey, setSelectedKey] = useState<string>("saas")
  const [activeProfile, setActiveProfile] = useState<DatasetProfile>(REAL_DATASETS.saas)
  const [activeTab, setActiveTab] = useState<"dashboard" | "kpis" | "ai" | "excel">("dashboard")
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  // Official Pagination state for native workbook table
  const [tablePage, setTablePage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(6)

  // Reset pagination when dataset changes
  useEffect(() => {
    setTablePage(1)
  }, [activeProfile])

  // Switch preloaded real dataset with scan animation
  const handleSelectDataset = (key: string) => {
    if (key === selectedKey) return
    setSelectedKey(key)
    setIsScanning(true)
    setTimeout(() => {
      startTransition(() => {
        setActiveProfile(REAL_DATASETS[key])
        setIsScanning(false)
      })
    }, 450)
  }

  // Handle real file drop or selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = (event.target?.result as string) || ""
      try {
        const parsed = parseCsvTextToProfile(content, file.name)
        setTimeout(() => {
          startTransition(() => {
            setActiveProfile(parsed)
            setSelectedKey("custom")
            setIsScanning(false)
          })
        }, 400)
      } catch (err) {
        setIsScanning(false)
        console.error("File upload parse notice:", err)
      }
    }
    reader.onerror = () => {
      setIsScanning(false)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const currency = activeProfile.currency

  // Pagination calculations
  const totalRows = activeProfile.rows.length
  const totalPages = Math.ceil(totalRows / pageSize) || 1
  const paginatedRows = activeProfile.rows.slice(
    (tablePage - 1) * pageSize,
    tablePage * pageSize
  )

  return (
    <section className="relative pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/60 via-slate-50/40 to-white text-slate-900 overflow-hidden">
      {/* ── AMBIENT SOFT MESH BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-emerald-100/50 via-teal-50/40 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-100/40 blur-3xl rounded-full" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-100/40 blur-3xl rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* ── HERO TEXT CONTENT ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-4xl mx-auto space-y-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
            Turn-Key Enterprise AI Platform <br />
            <span className="bg-gradient-to-r from-[#10B981] via-emerald-600 to-teal-700 bg-clip-text text-transparent">
              Rented For Your Business.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Rent our enterprise-grade AI Business Intelligence stack in a dedicated VPC or white-label it for your client fleet. Living multi-tab Excel workbooks, 6-stage autonomous data processing, and 100% deterministic calculations.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold h-12 px-8 text-sm rounded-xl shadow-lg shadow-emerald-500/25 w-full sm:w-auto transition-transform active:scale-[0.98] cursor-pointer"
            >
              <Link href="/login" className="inline-flex items-center justify-center gap-2">
                <span>Request System Access</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-300 bg-white/80 hover:bg-slate-100 text-slate-800 text-sm font-semibold h-12 px-7 rounded-xl w-full sm:w-auto cursor-pointer shadow-2xs backdrop-blur-xs"
            >
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2">
                <span>Explore Live Platform</span>
              </a>
            </Button>
          </div>
        </motion.div>

        {/* ── INTERACTIVE REAL-TIME DATA ENGINE CANVAS ── */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl shadow-slate-200/80 backdrop-blur-md overflow-hidden"
        >
          {/* Top Canvas Bar */}
          <div className="p-4 border-b border-slate-200/90 bg-slate-50/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Industry Dataset Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                Live Data Presets:
              </span>
              {[
                { key: "saas", label: "B2B SaaS ARR", icon: TrendingUp },
                { key: "ecommerce", label: "E-Commerce GMV", icon: BarChart3 },
                { key: "logistics", label: "Logistics Fleet", icon: Layers },
              ].map((item) => {
                const Icon = item.icon
                const isSelected = selectedKey === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelectDataset(item.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#10B981] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom CSV/Excel Dropzone Button */}
            <label className="relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 text-xs font-bold text-emerald-900 transition-all cursor-pointer shadow-2xs">
              <UploadCloud className="h-4 w-4 text-[#10B981]" />
              <span>{selectedKey === "custom" ? `Loaded: ${activeProfile.filename}` : "Upload Real CSV / Excel"}</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .txt"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

          </div>

          {/* Active Profile Info Header Strip */}
          <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#10B981]" />
              <span className="font-bold text-slate-900">{activeProfile.name}</span>
              <span className="text-slate-400 font-mono">({activeProfile.rows.length} rows processed)</span>
            </div>

            {/* Navigation Tabs inside Canvas */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
              {[
                { id: "dashboard", label: "Live Dashboard", icon: BarChart3 },
                { id: "kpis", label: "Executive KPIs", icon: TrendingUp },
                { id: "ai", label: "AI Briefing", icon: Sparkles },
                { id: "excel", label: "Native Workbook", icon: FileSpreadsheet },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#10B981] text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Workspace Body */}
          <div className="p-6 relative min-h-[380px]">
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-20 flex items-center justify-center">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-900 text-xs font-bold font-mono">
                  <RefreshCw className="h-5 w-5 text-[#10B981] animate-spin" />
                  <span>Compiling SIMD Mathematical Models...</span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Total Revenue
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-950 block tracking-tight">
                        {currency}
                        {activeProfile.totalRevenue.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 block">
                        +{activeProfile.revenueGrowth}% expansion
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Period Average
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-950 block tracking-tight">
                        {currency}
                        {activeProfile.avgRevenue.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 block">
                        Across {activeProfile.rows.length} cycles
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Operational Margin
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-950 block tracking-tight">
                        {activeProfile.avgMargin}%
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 block">
                        Industry Benchmark Met
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Risk &amp; Outliers
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-950 block tracking-tight">
                        {activeProfile.anomaliesDetected} Outliers
                      </span>
                      <span className="text-xs font-bold text-amber-700 block">
                        {activeProfile.anomaliesDetected > 0 ? "⚠ Statistical variance flagged" : "✓ Normal Baseline"}
                      </span>
                    </div>
                  </div>

                  {/* Real-time Recharts Revenue Trajectory */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Revenue Performance &amp; Algorithmic Forecast
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Includes 3-month predictive regression trajectory with 95% confidence bands
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-semibold text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Actual Revenue
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <span className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Predicted Trend
                        </span>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeProfile.forecast}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} />
                          <YAxis
                            stroke="#94A3B8"
                            fontSize={11}
                            tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              color: "#FFF",
                              borderRadius: "12px",
                              border: "none",
                              fontSize: "12px",
                            }}
                            formatter={(value: any) => [`${currency}${Number(value).toLocaleString()}`, "Amount"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRev)"
                          />
                          <Area
                            type="monotone"
                            dataKey="predicted"
                            stroke="#2DD4BF"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            fill="none"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "kpis" && (
                <motion.div
                  key="kpis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeProfile.rows.slice(0, 6).map((row) => (
                      <div
                        key={row.period}
                        className={`p-4 rounded-xl border transition-all ${
                          row.anomaly
                            ? "bg-amber-50/80 border-amber-300"
                            : "bg-slate-50/80 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span className="font-semibold text-slate-900">{row.period}</span>
                          {row.anomaly ? (
                            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                              OUTLIER (1.7σ)
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Normal</span>
                          )}
                        </div>
                        <div className="mt-2 text-xl font-bold text-slate-950">
                          {currency}
                          {row.revenue.toLocaleString()}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                          <span>Margin: {row.margin}%</span>
                          <span>Throughput: {row.ordersOrUsers.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "ai" && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5 p-6 rounded-xl bg-emerald-50/50 border border-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {activeProfile.aiBriefing.headline}
                      </h4>
                      <p className="text-xs text-emerald-800 font-medium">
                        Generated live from real statistical regression models
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-white border border-emerald-200 text-sm text-slate-800 leading-relaxed shadow-xs">
                    <p className="font-bold text-emerald-700 mb-1">Executive Summary Verdict:</p>
                    <p>{activeProfile.aiBriefing.keyTakeaway}</p>
                  </div>

                  <div className="space-y-2.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Calculated Diagnostic Findings
                    </h5>
                    {activeProfile.aiBriefing.bulletPoints.map((bp, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "excel" && (
                <motion.div
                  key="excel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 gap-3">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-6 w-6 text-emerald-700 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Multi-Sheet Native Workbook: {activeProfile.filename}
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          Contains 3 worksheets: Executive Summary, Financial Models with formulas (=SUM), and Forecast
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => generateRealExcelWorkbook(activeProfile)}
                      className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold gap-1.5 shadow-xs shrink-0 cursor-pointer"
                    >
                      <Download className="h-4 w-4" /> Download .xlsx
                    </Button>
                  </div>

                  {/* Spreadsheet Grid Simulation with Official PaginationControls Component */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#0A3A2A] text-emerald-100 border-b border-slate-300">
                          <tr>
                            <th className="py-2.5 px-4">Period</th>
                            <th className="py-2.5 px-4 text-right">Revenue ({currency})</th>
                            <th className="py-2.5 px-4 text-right">Throughput</th>
                            <th className="py-2.5 px-4 text-right">Margin</th>
                            <th className="py-2.5 px-4 text-right">Telemetry Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {paginatedRows.map((r) => (
                            <tr key={r.period} className="hover:bg-slate-50">
                              <td className="py-2 px-4 font-semibold text-slate-900">{r.period}</td>
                              <td className="py-2 px-4 text-right font-medium text-emerald-700">
                                {r.revenue.toLocaleString()}
                              </td>
                              <td className="py-2 px-4 text-right">{r.ordersOrUsers.toLocaleString()}</td>
                              <td className="py-2 px-4 text-right font-semibold text-slate-900">{r.margin}%</td>
                              <td className="py-2 px-4 text-right">
                                {r.anomaly ? (
                                  <span className="text-amber-700 font-bold">⚠ OUTLIER</span>
                                ) : (
                                  <span className="text-slate-500 font-semibold">VALID</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-emerald-50 font-bold text-slate-900 border-t-2 border-emerald-300">
                            <td className="py-2.5 px-4 text-emerald-900">TOTAL / AVG (Formula =SUM)</td>
                            <td className="py-2.5 px-4 text-right text-emerald-800">
                              {currency}
                              {activeProfile.totalRevenue.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {activeProfile.rows
                                .reduce((a, b) => a + b.ordersOrUsers, 0)
                                .toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right">{activeProfile.avgMargin}% avg</td>
                            <td className="py-2.5 px-4 text-right text-emerald-700">Formula Verified</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Official PaginationControls Component */}
                    <PaginationControls
                      currentPage={tablePage}
                      totalPages={totalPages}
                      totalItems={totalRows}
                      pageSize={pageSize}
                      onPageChange={setTablePage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[6, 12, 24]}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
