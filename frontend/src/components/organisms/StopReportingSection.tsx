"use client"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { FileSpreadsheet, CheckCircle2, Bot, UploadCloud, RefreshCw, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } }

const INITIAL_DONE_FILES = [
  { name: "Employee_Performance_H1.xlsx", size: "1.2 MB" },
  { name: "Marketing_Spend_July.csv", size: "840 KB" }
]

export function StopReportingSection() {
  const [progress, setProgress] = useState(0)
  const [processingState, setProcessingState] = useState<"idle" | "processing" | "done">("idle")
  const [doneFiles, setDoneFiles] = useState(INITIAL_DONE_FILES)
  const [activeTab, setActiveTab] = useState("overview")

  const startUpload = () => {
    if (processingState !== "idle") return
    setProcessingState("processing")
    setProgress(0)
  }

  useEffect(() => {
    if (processingState === "processing") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setProcessingState("done")
            setDoneFiles(current => [{ name: "Q3_Sales_Report.xlsx", size: "4.2 MB" }, ...current])
            return 100
          }
          // Random progress increments
          return prev + Math.floor(Math.random() * 15) + 5
        })
      }, 400)
      return () => clearInterval(interval)
    }
  }, [processingState])

  const resetSimulation = () => {
    setProcessingState("idle")
    setProgress(0)
    setDoneFiles(INITIAL_DONE_FILES)
  }

  return (
    <section id="platform" className="py-16 sm:py-24 px-4 sm:px-8 bg-slate-50/60 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="space-y-4 mb-10 sm:mb-16 text-center max-w-2xl mx-auto"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Stop Manual Reporting
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 text-base leading-relaxed">
            Drop in your messy, disconnected CSV files and let the AI generate polished, narrative-rich interactive workbooks in seconds.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-24 items-stretch">

          {/* Left — File upload simulation */}
          <motion.div
            initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55 }}
            className="h-full"
          >
            <div className="rounded-2xl border bg-white shadow-lg p-4 sm:p-6 max-w-md mx-auto lg:ml-auto lg:mr-0 relative w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="text-sm font-bold text-slate-800">Data Import Queue</div>
                {processingState === "done" && (
                  <button onClick={resetSimulation} className="text-[10px] text-slate-400 hover:text-[#10B981] flex items-center gap-1 transition-colors">
                    <RefreshCw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

              {/* Active Processing Box */}
              <Tooltip>
                <TooltipTrigger className="w-full text-left flex-1 flex flex-col min-h-[140px]">
                  <div 
                    onClick={startUpload}
                    className={`flex-1 flex flex-col justify-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all duration-300 ${processingState === 'idle' ? 'border-slate-300 bg-slate-50 cursor-pointer hover:border-[#10B981] hover:bg-[#10B981]/5 group' : processingState === 'processing' ? 'border-[#10B981]/50 bg-[#10B981]/5 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-emerald-500 bg-emerald-50 cursor-default hidden'}`}
                  >
                    {processingState === "idle" ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <div className="h-10 w-10 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <UploadCloud className="h-5 w-5 text-[#10B981]" />
                        </div>
                        <div className="text-xs font-semibold text-slate-700">Drop files or click to upload</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Supports CSV, XLSX, SQL dumps</div>
                      </div>
                    ) : (
                      <>
                        <div className="h-9 w-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="h-5 w-5 text-[#10B981]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <div className="text-xs font-bold text-slate-700">Q3_Sales_Report.xlsx</div>
                            <div className="text-[10px] font-mono text-[#10B981]">{Math.min(progress, 100)}%</div>
                          </div>
                          <div className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-1.5">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                              <Bot className="h-3 w-3 text-[#10B981]" />
                            </motion.div>
                            AI parsing columns & detecting anomalies...
                          </div>
                          <Progress value={progress} className="h-1.5 [&>div]:bg-[#10B981]" />
                        </div>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{processingState === 'idle' ? "Click to start the AI analysis simulation" : "AI is analyzing your spreadsheet data in real-time"}</TooltipContent>
              </Tooltip>

              {/* Done Files List */}
              <div className="space-y-2 mt-4 relative">
                <AnimatePresence>
                  {doneFiles.map((f, idx) => (
                    <motion.div 
                      key={f.name + idx} 
                      initial={{ opacity: 0, height: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, height: 'auto', scale: 1 }} 
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 rounded-xl border p-3 bg-slate-50/80 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-semibold text-slate-700 truncate">{f.name}</div>
                        <div className="text-[9px] text-slate-400">{f.size}</div>
                      </div>
                      <Badge variant="outline" className="text-[9px] text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20">Analyzed</Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right — interactive report card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55, delay: 0.1 }}
          >
            <Card className="shadow-2xl shadow-[#10B981]/5 border-slate-200 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#10B981] to-emerald-300" />
              <CardHeader className="pb-3 border-b bg-slate-50/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-[#10B981]/10 flex items-center justify-center">
                      <BarChart3 className="h-3.5 w-3.5 text-[#10B981]" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-800">Monthly Execution Report</CardTitle>
                  </div>
                  <Badge className="text-[9px] bg-red-500 text-white animate-pulse shadow-sm border-0">LIVE</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border rounded-xl p-3 shadow-sm">
                    <div className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Revenue</div>
                    <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                      $1.4M <span className="text-xs text-[#10B981] font-bold">+24.8%</span>
                    </div>
                  </div>
                  <div className="bg-white border rounded-xl p-3 shadow-sm">
                    <div className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider">AI Anomalies Found</div>
                    <div className="text-2xl font-black text-red-500 flex items-baseline gap-2">
                      03 <span className="text-[10px] text-red-400 font-medium">Requires attention</span>
                    </div>
                  </div>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-8 bg-slate-100/80 p-1 w-full grid grid-cols-3">
                    <TabsTrigger value="overview" className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Overview</TabsTrigger>
                    <TabsTrigger value="variance" className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Variance</TabsTrigger>
                    <TabsTrigger value="breakdown" className="text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Breakdown</TabsTrigger>
                  </TabsList>
                  
                  <div className="mt-4 h-[120px] bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                    <AnimatePresence mode="wait">
                      {activeTab === "overview" && (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full flex flex-col justify-center">
                          <p className="text-[11px] text-slate-700 leading-relaxed mb-3">
                            <span className="font-bold text-[#10B981]">Executive Summary:</span> AI detected 3 hidden anomalies in regional sales data that were impacting margins. Despite this, Q3 exceeded targets by 24.8%. The predictive model forecasts a further <strong>+11% growth</strong> in October if pricing is adjusted in the EMEA region.
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200">#RevenueGrowth</Badge>
                            <Badge variant="secondary" className="text-[9px] bg-red-50 text-red-600 border-red-200">#EMEA_Anomaly</Badge>
                          </div>
                        </motion.div>
                      )}
                      
                      {activeTab === "variance" && (
                        <motion.div key="variance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
                          <ReactECharts
                            option={{
                              grid: { top: 10, right: 10, bottom: 20, left: 40 },
                              tooltip: { trigger: 'axis' },
                              xAxis: { type: 'category', data: ['Budget', 'Actual'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 9 } },
                              yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } }, axisLabel: { fontSize: 9, formatter: '${value}K' } },
                              series: [{
                                data: [
                                  { value: 1200, itemStyle: { color: '#94a3b8' } },
                                  { value: 1384, itemStyle: { color: '#10B981' } }
                                ],
                                type: 'bar',
                                barWidth: '40%',
                                itemStyle: { borderRadius: [4, 4, 0, 0] }
                              }]
                            }}
                            style={{ height: '100%', minHeight: 100, minWidth: 200, width: '100%' }}
                          />
                        </motion.div>
                      )}
                      
                      {activeTab === "breakdown" && (
                        <motion.div key="breakdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full flex items-center justify-between px-4">
                           <ReactECharts
                            option={{
                              tooltip: { trigger: 'item', confine: true },
                              series: [{
                                name: 'Region',
                                type: 'pie',
                                radius: ['50%', '80%'],
                                avoidLabelOverlap: false,
                                label: { show: false },
                                data: [
                                  { value: 42, name: 'North', itemStyle: { color: '#10B981' } },
                                  { value: 28, name: 'South', itemStyle: { color: '#34d399' } },
                                  { value: 18, name: 'West', itemStyle: { color: '#6ee7b7' } },
                                  { value: 12, name: 'East', itemStyle: { color: '#a7f3d0' } }
                                ]
                              }]
                            }}
                            style={{ height: '100%', minHeight: 100, minWidth: 120, width: '120px' }}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-[#10B981]" /> North (42%)</div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-[#34d399]" /> South (28%)</div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-[#6ee7b7]" /> West (18%)</div>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-700"><span className="h-2 w-2 rounded-full bg-[#a7f3d0]" /> East (12%)</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
