"use client"
import React, { useState } from "react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Bot, TrendingUp, CheckCircle2, ChevronRight, Database, BarChart3, Bell, TerminalSquare, Send, Activity, Sparkles, Server, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
}
const stagger: Variants = { visible: { transition: { staggerChildren: 0.1 } } }

const FEATURES = [
  {
    id: "integration",
    icon: Database,
    title: "Direct Data Links",
    desc: "Connect directly to your database. AI insights update the moment your data changes — no manual exports, no stale reports.",
    bullets: ["PostgreSQL, Snowflake, BigQuery", "Real-time sync engine", "Bank-grade encryption"],
  },
  {
    id: "copilot",
    icon: Bot,
    title: "AI Copilot (Voice & Chat)",
    desc: "Query your data using natural language. 'Show me top 5 customers by revenue in Q3' — answered in seconds.",
    bullets: ["Zero SQL required", "Context-aware memory", "Visual chart generation"],
  },
  {
    id: "automl",
    icon: BarChart3,
    title: "Low-Code AutoML",
    desc: "Build predictive models without a data science team. Automatic feature selection and model evaluation.",
    bullets: ["One-click deployments", "90%+ confidence intervals", "Explainable AI (XAI)"],
  },
  {
    id: "alerts",
    icon: Bell,
    title: "Automated Insights",
    desc: "Never miss a critical business event. Get real-time alerts when anomalies are detected in your KPIs.",
    bullets: ["Anomaly detection algorithms", "Slack & Email integrations", "Custom trigger thresholds"],
  },
]

const DB_CONNECTORS = [
  { name: "PostgreSQL", status: "Connected", ping: "12ms", active: true },
  { name: "BigQuery", status: "Connected", ping: "45ms", active: true },
  { name: "Snowflake", status: "Disconnected", ping: "-", active: false },
  { name: "Redshift", status: "Disconnected", ping: "-", active: false },
]

export function IntelligenceSection() {
  const [activeFeature, setActiveFeature] = useState("integration")
  
  // Copilot State
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "user", text: "Show me Q3 revenue by region" },
    { role: "ai", sql: "SELECT region, SUM(revenue) FROM sales WHERE quarter = 'Q3' GROUP BY region;" }
  ])

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setMessages(prev => [...prev, { role: "user", text: chatInput }])
    setChatInput("")
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", sql: "SELECT * FROM analytics_events LIMIT 10;" }])
    }, 800)
  }

  // Alerts State
  const [alerts, setAlerts] = useState([
    { title: "Unusual Churn Spike", metric: "Churn Rate", value: "1.4%", status: "critical", time: "2 mins ago" },
    { title: "Revenue Milestone", metric: "MRR", value: "$1.2M", status: "success", time: "1 hr ago" },
    { title: "API Latency Warning", metric: "Response Time", value: "850ms", status: "warning", time: "3 hrs ago" },
  ])

  return (
    <section id="solutions" className="py-16 sm:py-24 px-4 sm:px-8 bg-white dark:bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-80px" }} variants={stagger} className="mb-10 sm:mb-16 text-center max-w-2xl mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-4">
            <Badge className="bg-[#10B981]/10 text-[#10B981] border-0 text-xs">Intelligence Layer</Badge>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Powerful Intelligence Layer
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-500 dark:text-slate-400 mt-4 text-base leading-relaxed">
            Built for the complexity of modern enterprise data stacks.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-16 items-start">
          {/* Left — Accordion features */}
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: "-60px" }} variants={stagger} className="space-y-4"
          >
            <Accordion 
              type="single" 
              value={[activeFeature]} 
              onValueChange={(val: any) => {
                if (Array.isArray(val) && val.length > 0) {
                  setActiveFeature(val[0])
                }
              }} 
              className="space-y-3"
            >
              {FEATURES.map((item) => {
                const Icon = item.icon
                return (
                  <motion.div key={item.id} variants={fadeUp}>
                    <AccordionItem value={item.id} className="rounded-2xl border border-slate-200/60 dark:border-white/10 px-5 bg-white dark:bg-white/5 data-[state=open]:shadow-md data-[state=open]:border-[#10B981]/30 transition-all">
                      <AccordionTrigger className="hover:no-underline py-4 gap-3">
                        <div className="flex items-center gap-3 text-left">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activeFeature === item.id ? 'bg-[#10B981] text-white shadow-md' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`font-bold text-sm transition-colors ${activeFeature === item.id ? 'text-[#10B981]' : 'text-slate-700 dark:text-slate-300'}`}>{item.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {item.bullets.map(b => (
                            <div key={b} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                              <span className="leading-tight pt-0.5">{b}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                )
              })}
            </Accordion>
            <motion.div variants={fadeUp} className="pt-2">
              <a href="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#10B981] hover:text-[#059669] transition-colors group">
                Sign in to your workspace <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </motion.div>

          {/* Right — Interactive Mocks */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55 }}
            className="relative w-full h-[400px] sm:h-[450px] min-h-[380px]"
          >
            <AnimatePresence mode="wait">
              
              {/* 1. Integration Mock */}
              {activeFeature === "integration" && (
                <motion.div key="integration" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute inset-0 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl p-6 shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center shadow-sm border border-[#10B981]/20">
                        <Server className="h-5 w-5 text-[#10B981]" />
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-sm">Live Connections</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[10px]">Secure Data Tunnels</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                      <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>
                      Active Sync
                    </Badge>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {DB_CONNECTORS.map((db, i) => (
                      <div key={db.name} className={`flex items-center justify-between p-3 rounded-xl border ${db.active ? 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 shadow-sm' : 'bg-white dark:bg-transparent border-slate-100 dark:border-white/5'} transition-colors hover:border-[#10B981]/30 cursor-pointer`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${db.active ? 'bg-white dark:bg-white/10 shadow-sm border border-slate-200/60 dark:border-white/10' : 'bg-slate-50 dark:bg-white/5'}`}>
                            <Database className={`h-4 w-4 ${db.active ? 'text-[#10B981]' : 'text-slate-400'}`} />
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${db.active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{db.name}</div>
                            <div className={`text-[10px] font-medium ${db.active ? 'text-[#10B981]' : 'text-slate-400'}`}>{db.status}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400">{db.ping}</span>
                          <Button size="sm" variant={db.active ? "outline" : "ghost"} className={`h-7 px-3 text-[10px] ${db.active ? 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-[#10B981] hover:bg-emerald-50 dark:hover:bg-white/10' : 'text-slate-400'}`}>
                            {db.active ? 'Manage' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 2. Copilot Mock */}
              {activeFeature === "copilot" && (
                <motion.div key="copilot" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute inset-0 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col overflow-hidden">
                  <div className="bg-white dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10 px-4 py-3 flex items-center gap-2 shadow-sm relative z-10">
                    <TerminalSquare className="h-5 w-5 text-[#10B981]" />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Natural Language to SQL</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-black/20">
                    {messages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-[#10B981] border-[#059669]' : 'bg-white dark:bg-white/10 border-slate-200/60 dark:border-white/10'}`}>
                          {msg.role === 'user' ? <span className="text-[10px] font-bold text-white">YOU</span> : <Sparkles className="h-4 w-4 text-[#10B981]" />}
                        </div>
                        <div className={`rounded-2xl p-3 text-xs leading-relaxed shadow-sm border ${msg.role === 'user' ? 'bg-[#10B981] text-white rounded-tr-none border-[#059669]' : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none border-slate-200/60 dark:border-white/10'}`}>
                          {msg.text && <p className={msg.role === 'user' ? 'font-medium' : ''}>{msg.text}</p>}
                          {msg.sql && (
                            <div className="mt-1.5 bg-slate-50 dark:bg-black/30 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 font-mono p-3 rounded-lg text-[10px] overflow-x-auto whitespace-pre">
                              <span className="text-pink-600 font-semibold">SELECT</span> region, <span className="text-indigo-600 font-semibold">SUM</span>(revenue)<br/>
                              <span className="text-pink-600 font-semibold">FROM</span> sales<br/>
                              <span className="text-pink-600 font-semibold">WHERE</span> quarter = <span className="text-emerald-600">&apos;Q3&apos;</span><br/>
                              <span className="text-pink-600 font-semibold">GROUP BY</span> region;
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <form onSubmit={handleChat} className="p-3 bg-white dark:bg-white/5 border-t border-slate-200/60 dark:border-white/10 flex gap-2">
                    <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a query (e.g. show revenue by region)..." className="text-xs bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 focus-visible:ring-[#10B981]" />
                    <Button type="submit" className="bg-[#10B981] hover:bg-[#059669] shrink-0 text-white px-3 shadow-sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* 3. AutoML Mock */}
              {activeFeature === "automl" && (
                <motion.div key="automl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute inset-0 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl p-6 shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-sm">Model Training History</div>
                        <div className="text-slate-400 text-[10px]">Churn Prediction v2.1</div>
                      </div>
                    </div>
                    <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20">Accuracy: 94.2%</Badge>
                  </div>
                  <div className="flex-1 -mx-4">
                    <ReactECharts 
                      option={{
                        grid: { top: 20, right: 20, bottom: 20, left: 40 },
                        tooltip: { trigger: 'axis' },
                        xAxis: { type: 'category', data: ['Ep 1', 'Ep 2', 'Ep 3', 'Ep 4', 'Ep 5', 'Ep 6', 'Ep 7', 'Ep 8'], boundaryGap: false, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 10, color: '#94a3b8' } },
                        yAxis: { type: 'value', min: 70, max: 100, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' } },
                        series: [
                          {
                            name: 'Training Acc',
                            data: [72, 78, 85, 88, 91, 92, 94, 94.2],
                            type: 'line',
                            smooth: true,
                            symbol: 'circle',
                            symbolSize: 8,
                            itemStyle: { color: '#6366f1' },
                            areaStyle: {
                              color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.2)' }, { offset: 1, color: 'rgba(99,102,241,0)' }] }
                            },
                            lineStyle: { width: 3 }
                          },
                          {
                            name: 'Validation Acc',
                            data: [70, 75, 82, 84, 87, 89, 91, 91.5],
                            type: 'line',
                            smooth: true,
                            symbol: 'circle',
                            symbolSize: 8,
                            itemStyle: { color: '#10B981' },
                            lineStyle: { width: 3, type: 'dashed' }
                          }
                        ]
                      }} 
                      style={{ height: '100%', minHeight: 200, minWidth: 200, width: '100%' }}
                    />
                  </div>
                  <div className="mt-4 flex gap-4 text-[10px] text-slate-500 dark:text-slate-400 justify-center bg-slate-50 dark:bg-white/5 py-2 rounded-lg border border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span> Training</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]"></span> Validation</div>
                  </div>
                </motion.div>
              )}

              {/* 4. Alerts Mock */}
              {activeFeature === "alerts" && (
                <motion.div key="alerts" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }} className="absolute inset-0 rounded-2xl bg-white dark:bg-white/5 backdrop-blur-xl p-6 shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-sm">Automated Alerts</div>
                        <div className="text-slate-400 text-[10px]">Real-time KPI Monitoring</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300">Configure Rules</Button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    <AnimatePresence>
                      {alerts.map((alert, i) => (
                        <motion.div key={alert.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 p-4 shadow-sm flex items-start gap-4 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${alert.status === 'critical' ? 'bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400' : alert.status === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400'}`}>
                            {alert.status === 'critical' ? <TrendingUp className="h-4 w-4" /> : alert.status === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{alert.title}</h4>
                              <span className="text-[9px] text-slate-400">{alert.time}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="secondary" className="text-[9px] font-normal px-1.5 py-0 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">{alert.metric}</Badge>
                              <span className={`text-[10px] font-bold ${alert.status === 'critical' ? 'text-red-500 dark:text-red-400' : alert.status === 'success' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>{alert.value}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
