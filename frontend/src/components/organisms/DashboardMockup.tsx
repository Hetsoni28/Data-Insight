"use client"
import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, ArrowRight, CheckCircle2, Zap, BarChart3, Database, FileSpreadsheet, BrainCircuit, TrendingUp, Download, Sparkles, RefreshCw, Search, Send, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })
import { toast } from "sonner"

const TABS = [
  { icon: BarChart3, label: "Overview", id: "overview" },
  { icon: Database, label: "Datasets", id: "datasets" },
  { icon: FileSpreadsheet, label: "Reports", id: "reports" },
  { icon: BrainCircuit, label: "AI Copilot", id: "ai" },
  { icon: TrendingUp, label: "Forecast", id: "forecast" },
]

export function DashboardMockup() {
  const [activeTab, setActiveTab] = useState("overview")

  // Syncing state for Datasets
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})

  const handleSync = (name: string) => {
    setSyncing(prev => ({ ...prev, [name]: true }))
    toast(`Syncing ${name}...`, { description: "Connecting to data source." })
    setTimeout(() => {
      setSyncing(prev => ({ ...prev, [name]: false }))
      toast.success(`${name} Synced!`, { description: "14,200 new rows fetched." })
    }, 2000)
  }

  // Reports state
  const [reportSearch, setReportSearch] = useState("")
  const reports = [
    { title: "Q3 Financial Analysis", date: "Today, 9:41 AM" },
    { title: "Churn Risk Cohorts", date: "Yesterday" },
    { title: "Marketing ROI Pipeline", date: "Oct 12, 2023" },
    { title: "Sales Funnel Dropoff", date: "Oct 10, 2023" },
  ].filter(r => r.title.toLowerCase().includes(reportSearch.toLowerCase()))

  // Copilot state
  const [messages, setMessages] = useState([
    { role: "user", text: "Why did churn spike to 1.2% this month?" },
    { role: "ai", text: "I analyzed the Stripe and Salesforce datasets. The spike is primarily due to 14 Enterprise accounts from the EU region failing payment retries, likely related to the new SCA regulations rolled out last week.", hasAction: true }
  ])
  const [chatInput, setChatInput] = useState("")

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const userText = chatInput
    setMessages(prev => [...prev, { role: "user", text: userText }])
    setChatInput("")
    
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "I am analyzing the data to find insights related to your request...", hasAction: false }])
    }, 600)
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-2xl overflow-hidden bg-slate-50 dark:bg-white/5 relative z-10">
      {/* Browser Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-white/10 border-b border-slate-200/60 dark:border-white/10">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 bg-white dark:bg-white/5 rounded border border-slate-200/60 dark:border-white/10 text-[10px] text-slate-400 px-3 py-0.5 max-w-[180px] shadow-sm">app.datainsight.ai</div>
      </div>

      <div className="flex h-[360px] sm:h-[400px] flex-col sm:flex-row">
        {/* Mobile tab bar — only visible on small screens */}
        <div className="flex sm:hidden overflow-x-auto border-b border-slate-200/60 dark:border-white/10 bg-white dark:bg-transparent px-1 shrink-0">
          {TABS.map(({ icon: Icon, label, id }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition-all ${active ? "border-[#10B981] text-[#10B981]" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"}`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden sm:flex w-36 border-r border-slate-200/60 dark:border-white/10 bg-white dark:bg-transparent flex-col gap-1 p-3 shrink-0">
          {TABS.map(({ icon: Icon, label, id }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all text-left ${active ? "bg-[#10B981] text-white shadow-md scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden relative bg-slate-50/50 dark:bg-transparent min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Revenue Dashboard</span>
                  <Badge variant="secondary" className="text-[10px] bg-[#10B981]/10 text-[#10B981] border-0 px-2 py-0.5">AI Live</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "Revenue", value: "$2.4M", change: "+18.4%" }, { label: "Clients", value: "142", change: "+12%" }, { label: "Churn", value: "1.2%", change: "-0.3%" }].map(kpi => (
                    <div key={kpi.label} className="bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-3 space-y-1 group hover:border-[#10B981]/40 transition-colors cursor-default">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{kpi.label}</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">{kpi.value}</div>
                      <div className="text-[10px] text-[#10B981] font-bold">{kpi.change} YoY</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-3 flex-1 flex flex-col relative overflow-hidden group">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Monthly Revenue & Forecast</div>
                  <div className="flex-1 -mx-2 -mb-2">
                    <ReactECharts 
                      option={{
                        grid: { top: 10, right: 10, bottom: 20, left: 35 },
                        tooltip: { trigger: 'axis', formatter: '${c}k' },
                        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 9, color: '#94a3b8' } },
                        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { fontSize: 9, color: '#94a3b8', formatter: '${value}k' } },
                        series: [{
                          data: [55, 70, 48, 82, 65, 90, 75, 88, 78, 105, 120, 140],
                          type: 'bar',
                          barWidth: '60%',
                          itemStyle: {
                            color: (params: any) => params.dataIndex >= 9 ? '#10B98140' : '#10B981',
                            borderRadius: [2, 2, 0, 0]
                          }
                        }]
                      }} 
                      style={{ height: '100%', minHeight: 120, minWidth: 200, width: '100%' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "datasets" && (
              <motion.div key="datasets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Connected Data Sources</span>
                  <Badge variant="outline" className="text-[10px]">3 Active</Badge>
                </div>
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                  {[
                    { name: "PostgreSQL Production", rows: "14.2M rows", status: "Synced 2m ago", color: "bg-emerald-500" },
                    { name: "Stripe Billing", rows: "840K records", status: "Synced 15m ago", color: "bg-indigo-500" },
                    { name: "Salesforce CRM", rows: "2.1M rows", status: "Synced 1h ago", color: "bg-sky-500" },
                  ].map((ds, i) => {
                    const isSyncing = syncing[ds.name]
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 p-3 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${ds.color}/10 border border-${ds.color.replace('bg-', '')}/20`}>
                            <Database className={`h-4 w-4 ${ds.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ds.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {isSyncing ? (
                                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span></span>
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                              )}
                              {isSyncing ? "Syncing..." : ds.status}
                              <span className="px-1 text-slate-300">•</span>
                              {ds.rows}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-[#10B981]" onClick={() => handleSync(ds.name)} disabled={isSyncing}>
                          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI Generated Reports</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Search reports..." 
                    className="h-8 pl-8 text-xs bg-white dark:bg-transparent border-slate-200 dark:border-white/10"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                  {reports.map((rep, i) => (
                    <motion.div key={rep.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 p-3.5 flex flex-col justify-between shadow-sm min-h-[90px] group hover:border-[#10B981]/50 cursor-pointer">
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5 group-hover:text-[#10B981] transition-colors" />
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight group-hover:text-[#10B981] transition-colors">{rep.title}</div>
                            <div className="text-[9px] text-slate-400 mt-1">{rep.date}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); toast.success("Downloading report..."); }}>
                          <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#10B981] transition-colors" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {reports.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-xs text-slate-500 dark:text-slate-400">No reports found.</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/20 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Data Insight Copilot</span>
                </div>
                
                <div className="flex-1 bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800' : 'bg-[#10B981]'}`}>
                          {msg.role === 'user' ? <span className="text-[9px] font-bold text-white">YOU</span> : <Sparkles className="h-3 w-3 text-white" />}
                        </div>
                        <div className={`rounded-xl p-2.5 text-[11px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-[#10B981]/10 text-slate-800 dark:text-slate-200 rounded-tl-none border border-[#10B981]/20'}`}>
                          {msg.text}
                          {msg.hasAction && (
                            <button className="bg-white dark:bg-transparent border border-[#10B981]/30 text-[#10B981] px-2.5 py-1.5 rounded-lg shadow-sm text-[9px] font-bold flex items-center gap-1.5 mt-2 hover:bg-[#10B981]/5 transition-colors">
                              <FileSpreadsheet className="h-3 w-3" /> View affected accounts (14)
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="p-2 border-t border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center gap-2">
                    <Input 
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask any data question..." 
                      className="h-8 text-xs bg-white dark:bg-transparent border-slate-200 dark:border-white/10 focus-visible:ring-[#10B981]" 
                    />
                    <Button type="submit" size="icon" className="h-8 w-8 bg-[#10B981] hover:bg-[#059669] shrink-0 text-white shadow-sm">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "forecast" && (
              <motion.div key="forecast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Q4 Revenue Forecast</span>
                  <Badge variant="outline" className="text-[10px] text-[#10B981] border-[#10B981] bg-[#10B981]/5 px-2">94% Confidence</Badge>
                </div>
                <div className="bg-white dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-4 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Predicted Q4 ARR</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white">$3.1M</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Target: $3.0M</div>
                      <div className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded text-[10px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> On Track
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 mt-4 -mx-2 -mb-2">
                    <ReactECharts 
                      option={{
                        grid: { top: 10, right: 10, bottom: 20, left: 35 },
                        tooltip: { trigger: 'axis', formatter: '${c}k' },
                        xAxis: { type: 'category', data: ['Sep', 'Oct', 'Nov', 'Dec'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 9, color: '#94a3b8' } },
                        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, axisLabel: { fontSize: 9, color: '#94a3b8', formatter: '${value}M' } },
                        series: [{
                          data: [2.1, 2.4, 2.7, 3.1],
                          type: 'line',
                          smooth: true,
                          symbolSize: 8,
                          itemStyle: { color: '#10B981' },
                          areaStyle: {
                            color: {
                              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                              colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }]
                            }
                          },
                          lineStyle: { width: 3 }
                        }]
                      }} 
                      style={{ height: '100%', minHeight: 150, minWidth: 200, width: '100%' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
