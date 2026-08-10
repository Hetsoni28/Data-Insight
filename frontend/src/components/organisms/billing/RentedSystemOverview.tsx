"use client"

import React from "react"
import { motion } from "framer-motion"
import { Database, HardDrive, Cpu, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react"
import { RentedResourcesData } from "@/lib/billing.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface RentedSystemOverviewProps {
  resources: RentedResourcesData | null
  onRequestExpansion: (type: "database" | "storage" | "ai_tokens" | "compute" | "backup") => void
}

export function RentedSystemOverview({ resources, onRequestExpansion }: RentedSystemOverviewProps) {
  if (!resources) return null

  const dbUsedPct = Math.min(100, Math.round((resources.database.used_gb / (resources.database.allocated_gb || 1)) * 100))
  const aiUsedPct = Math.min(100, Math.round((resources.ai_processing.used_tokens / (resources.ai_processing.monthly_quota_tokens || 1)) * 100))
  const storageUsedPct = Math.min(100, Math.round((resources.storage.used_gb / (resources.storage.allocated_gb || 1)) * 100))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Rented System & Resource Allocations</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Real-time telemetry and capacity metrics for your dedicated enterprise environment.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 font-bold">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> All Systems Nominal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Dedicated Database */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 hover:border-emerald-500/30 transition-all">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {resources.database.engine}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">
                    {resources.database.tier}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-extrabold">
                Dedicated VPC
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <span>Database Storage Allocated</span>
                  <span className="font-mono">{resources.database.used_gb} GB / {resources.database.allocated_gb} GB ({dbUsedPct}%)</span>
                </div>
                <Progress value={dbUsedPct} className="h-2 bg-slate-100 dark:bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Deployment Region</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{resources.database.region}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Connection Pooling</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{resources.database.connection_pooling}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Backup Retention</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{resources.database.backup_retention_days} Days WAL Archival</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Isolation Mode</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Single-Tenant Physical</span>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestExpansion("database")}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 font-bold p-2 rounded-xl h-auto transition-all"
                >
                  Expand Database IOPS / Storage <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Dedicated Storage */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 hover:border-teal-500/30 transition-all">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Enterprise Cloud Storage
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">
                    {resources.storage.redundancy}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-extrabold">
                Encrypted
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <span>Storage Utilization</span>
                  <span className="font-mono">{resources.storage.used_gb} GB / {resources.storage.allocated_gb} GB ({storageUsedPct}%)</span>
                </div>
                <Progress value={storageUsedPct} className="h-2 bg-slate-100 dark:bg-white/5" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Datasets</span>
                  <span className="font-black text-slate-900 dark:text-white text-base font-mono">{resources.storage.datasets_count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reports</span>
                  <span className="font-black text-slate-900 dark:text-white text-base font-mono">{resources.storage.reports_count}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Snapshots</span>
                  <span className="font-black text-slate-900 dark:text-white text-base font-mono">{resources.storage.backup_snapshots_count}</span>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Security Standard: <strong className="text-slate-800 dark:text-slate-200">{resources.storage.encryption}</strong>
              </p>

              <div className="pt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestExpansion("storage")}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:bg-teal-500/10 font-bold p-2 rounded-xl h-auto transition-all"
                >
                  Add Storage Allocation <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: AI Processing Engine */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 hover:border-violet-500/30 transition-all">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    AI Processing Engine
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">
                    Claude 3.5 Sonnet • GPT-4o • DeepSeek R1
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-xs font-extrabold">
                Autonomous
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <span>Monthly AI Tokens Allocation</span>
                  <span className="font-mono">{(resources.ai_processing.used_tokens / 1_000_000).toFixed(2)}M / {(resources.ai_processing.monthly_quota_tokens / 1_000_000).toFixed(0)}M ({aiUsedPct}%)</span>
                </div>
                <Progress value={aiUsedPct} className="h-2 bg-slate-100 dark:bg-white/5" />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Feature Breakdown</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">AI Copilot</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono">
                      {((resources.ai_processing.features_breakdown["copilot_chat"]?.tokens || 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Excel Engine</span>
                    <span className="font-black text-slate-900 dark:text-white font-mono">
                      {((resources.ai_processing.features_breakdown["excel_compiler"]?.tokens || 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestExpansion("ai_tokens")}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-500/10 font-bold p-2 rounded-xl h-auto transition-all"
                >
                  Increase Token Quota <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 4: Backup & Disaster Recovery */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 hover:border-blue-500/30 transition-all">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Backup & Disaster Recovery
                  </CardTitle>
                  <CardDescription className="text-xs font-medium">
                    Automated High-Availability Infrastructure
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-extrabold">
                99.99% SLA
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recovery Point (RPO)</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm font-mono">{resources.backup_recovery.rpo}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recovery Time (RTO)</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm font-mono">{resources.backup_recovery.rto}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Point-In-Time Restore</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Continuous Enabled</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Snapshots</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Automated 02:00 UTC</span>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestExpansion("backup")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-500/10 font-bold p-2 rounded-xl h-auto transition-all"
                >
                  Configure Custom Retention <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
