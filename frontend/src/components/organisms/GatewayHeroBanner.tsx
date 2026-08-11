"use client"
import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShieldCheck, Search, KeyRound, Download, RefreshCw,
  FileText, X, Copy, Check, Eye, EyeOff, Loader2, AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { gatewayService } from "@/lib/gatewayService"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface GatewayHeroBannerProps {
  onSearch?: (q: string) => void
  onEnvironment?: (env: string) => void
  onDateRange?: (range: string) => void
  onRefresh?: () => void
  liveRequests?: any[]
}

// ─── Export Logs Modal ─────────────────────────────────────────────────────
function ExportLogsModal({ open, onClose, requests }: { open: boolean; onClose: () => void; requests: any[] }) {
  const [format, setFormat] = useState<"csv" | "json">("csv")
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      if (format === "csv") {
        const headers = ["timestamp", "method", "endpoint", "status_code", "latency_ms", "ip_address", "country"]
        const rows = requests.map(r =>
          headers.map(h => JSON.stringify(r[h] ?? "")).join(",")
        )
        const csv = [headers.join(","), ...rows].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `api-logs-${Date.now()}.csv`; a.click()
        URL.revokeObjectURL(url)
      } else {
        const json = JSON.stringify(requests, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `api-logs-${Date.now()}.json`; a.click()
        URL.revokeObjectURL(url)
      }
      setExporting(false)
      onClose()
      toast.success(`Exported ${requests.length} logs as ${format.toUpperCase()}`)
    }, 800)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Download className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Export API Logs</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-300 font-medium">{requests.length} records ready to export</p>
                <p className="text-xs text-slate-400 mt-1">Last {requests.length} API requests from live stream</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["csv", "json"] as const).map(f => (
                    <button key={f} onClick={() => setFormat(f)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${format === f
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
                      .{f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
                <Button onClick={handleExport} disabled={exporting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                  {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</> : <><Download className="w-4 h-4 mr-2" />Export {format.toUpperCase()}</>}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Generate Report Modal ──────────────────────────────────────────────────
function GenerateReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setDone(true)
      setTimeout(() => { setDone(false); onClose() }, 2000)
      toast.success("API Health Report generated successfully!")
    }, 1500)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generate API Report</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {["API Traffic Summary", "Error Rate Analysis", "Top Endpoints by Latency", "Security Events", "Developer App Usage"].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item}</span>
                </div>
              ))}

              <div className="pt-2 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
                <Button onClick={handleGenerate} disabled={generating || done}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                  {done ? <><Check className="w-4 h-4 mr-2" />Generated!</>
                    : generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                      : <><FileText className="w-4 h-4 mr-2" />Generate Report</>}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Create API Key Modal ───────────────────────────────────────────────────
function CreateApiKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<string[]>(["read:all"])
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const scopeOptions = ["read:all", "write:all", "read:datasets", "write:datasets", "read:reports", "write:reports", "admin:billing"]

  const toggleScope = (s: string) => setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Please enter a key name"); return }
    setCreating(true)
    // Simulate key creation (in production, call a real API)
    await new Promise(r => setTimeout(r, 1000))
    const key = `sk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`
    setCreatedKey(key)
    setCreating(false)
    queryClient.invalidateQueries({ queryKey: ['api-gateway', 'overview'] })
    toast.success(`API Key "${name}" created successfully`)
  }

  const handleCopy = () => {
    if (!createdKey) return
    navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => { setName(""); setScopes(["read:all"]); setCreatedKey(null); setCopied(false); setShowKey(false); onClose() }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{createdKey ? "API Key Created!" : "Create New API Key"}</h2>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {createdKey ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <p className="text-xs font-semibold text-amber-300">Copy this key now — it won&apos;t be shown again!</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 bg-black/30 rounded-lg p-3 font-mono text-sm">
                    <span className="flex-1 text-emerald-300 break-all text-xs">
                      {showKey ? createdKey : createdKey.replace(/./g, "•")}
                    </span>
                    <button onClick={() => setShowKey(!showKey)} className="text-slate-400 hover:text-white shrink-0">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={handleCopy} className="text-slate-400 hover:text-emerald-400 shrink-0 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">Done</Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Key Name <span className="text-red-500">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production Backend, Mobile App..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Permissions / Scopes</label>
                  <div className="grid grid-cols-2 gap-2">
                    {scopeOptions.map(s => (
                      <button key={s} onClick={() => toggleScope(s)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs font-mono transition-all ${scopes.includes(s)
                          ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"}`}>
                        {scopes.includes(s) && <Check className="w-3 h-3 inline mr-1" />}{s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
                  <Button onClick={handleCreate} disabled={creating}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><KeyRound className="w-4 h-4 mr-2" />Create Key</>}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Banner Component ──────────────────────────────────────────────────
export function GatewayHeroBanner({ onSearch, onEnvironment, onDateRange, onRefresh, liveRequests = [] }: GatewayHeroBannerProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [createKeyOpen, setCreateKeyOpen] = useState(false)
  const [searchVal, setSearchVal] = useState("")
  const [envVal, setEnvVal] = useState("All Environments")
  const [rangeVal, setRangeVal] = useState("Last 30 Days")
  const [refreshing, setRefreshing] = useState(false)

  const handleSearch = (v: string) => { setSearchVal(v); onSearch?.(v) }
  const handleEnv = (v: string) => { setEnvVal(v); onEnvironment?.(v) }
  const handleRange = (v: string) => { setRangeVal(v); onDateRange?.(v) }
  const handleRefresh = () => {
    setRefreshing(true)
    onRefresh?.()
    setTimeout(() => setRefreshing(false), 1000)
    toast.success("Dashboard refreshed")
  }

  return (
    <>
      <ExportLogsModal open={exportOpen} onClose={() => setExportOpen(false)} requests={liveRequests} />
      <GenerateReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
      <CreateApiKeyModal open={createKeyOpen} onClose={() => setCreateKeyOpen(false)} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[#0c402d] rounded-lg p-8 shadow-xl border border-[#082f22] mb-8"
      >
        {/* Animated Particles / Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">API Command Center</h1>
            </div>
            <p className="text-emerald-100/80 max-w-xl text-lg leading-relaxed">
              Manage every API endpoint, developer application, webhook, and platform integration.
              Monitor live traffic, enforce security quotas, and scale your infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2 text-emerald-400" />
              Export Logs
            </Button>
            <Button
              variant="outline"
              onClick={() => setReportOpen(true)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2 text-emerald-400" />
              Generate Report
            </Button>
            <Button
              onClick={() => setCreateKeyOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </div>

        {/* Control Bar */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search endpoints, keys, or developers..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={envVal}
              onChange={e => handleEnv(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="All Environments">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
            </select>
            <select
              value={rangeVal}
              onChange={e => handleRange(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Today">Today</option>
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              title="Refresh dashboard"
              className="text-slate-400 hover:text-white hover:bg-white/10 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
