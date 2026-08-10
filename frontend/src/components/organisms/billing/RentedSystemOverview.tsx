"use client"

import React from "react"
import { Database, HardDrive, Cpu, ShieldCheck, Activity, CheckCircle2, Clock, Zap, ArrowUpRight } from "lucide-react"
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
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rented System & Resource Allocations</h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry and capacity metrics for your dedicated enterprise environment.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> All Systems Nominal
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Dedicated Database */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  {resources.database.engine}
                </CardTitle>
                <CardDescription className="text-xs">
                  {resources.database.tier}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              Dedicated VPC
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {/* Storage Progress */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>Database Storage Allocated</span>
                <span>{resources.database.used_gb} GB / {resources.database.allocated_gb} GB ({dbUsedPct}%)</span>
              </div>
              <Progress value={dbUsedPct} className="h-2 bg-slate-100 dark:bg-white/5" />
            </div>

            {/* Spec Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Deployment Region</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{resources.database.region}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Connection Pooling</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{resources.database.connection_pooling}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Backup Retention</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{resources.database.backup_retention_days} Days WAL Archival</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Isolation Mode</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Single-Tenant Physical</span>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestExpansion("database")}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-0 h-auto font-semibold"
              >
                Expand Database IOPS / Storage <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Dedicated Storage */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/60">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Enterprise Cloud Storage
                </CardTitle>
                <CardDescription className="text-xs">
                  {resources.storage.redundancy}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-xs font-semibold">
              Encrypted
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {/* Storage Progress */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>Storage Utilization</span>
                <span>{resources.storage.used_gb} GB / {resources.storage.allocated_gb} GB ({storageUsedPct}%)</span>
              </div>
              <Progress value={storageUsedPct} className="h-2 bg-slate-100 dark:bg-white/5" />
            </div>

            {/* Spec Details Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Datasets</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{resources.storage.datasets_count}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reports</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{resources.storage.reports_count}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Snapshots</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{resources.storage.backup_snapshots_count}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Security: <strong className="text-slate-700 dark:text-slate-300">{resources.storage.encryption}</strong>
            </p>

            <div className="pt-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestExpansion("storage")}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 p-0 h-auto font-semibold"
              >
                Add Storage Allocation <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: AI Processing Engine */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/60">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  AI Processing Engine
                </CardTitle>
                <CardDescription className="text-xs">
                  Claude 3.5 Sonnet · GPT-4o · DeepSeek R1
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 text-xs font-semibold">
              Autonomous
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {/* Tokens Progress */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>Monthly AI Tokens Allocation</span>
                <span>{(resources.ai_processing.used_tokens / 1_000_000).toFixed(2)}M / {(resources.ai_processing.monthly_quota_tokens / 1_000_000).toFixed(0)}M ({aiUsedPct}%)</span>
              </div>
              <Progress value={aiUsedPct} className="h-2 bg-slate-100 dark:bg-white/5" />
            </div>

            {/* AI Features Breakdown */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Feature Usage</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                  <span className="text-slate-600 dark:text-slate-300">AI Copilot</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {((resources.ai_processing.features_breakdown["copilot_chat"]?.tokens || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                  <span className="text-slate-600 dark:text-slate-300">Excel Engine</span>
                  <span className="font-bold text-slate-900 dark:text-white">
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
                className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 p-0 h-auto font-semibold"
              >
                Increase Token Quota <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Backup & Disaster Recovery */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Backup & Disaster Recovery
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated High-Availability Infrastructure
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-semibold">
              99.99% SLA
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recovery Point (RPO)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{resources.backup_recovery.rpo}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recovery Time (RTO)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{resources.backup_recovery.rto}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Point-In-Time Restore</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Continuous Enabled</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Daily Snapshots</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Automated 02:00 UTC</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">Last System Snapshot</span>
              </div>
              <span className="font-medium text-slate-900 dark:text-white">3 hours ago</span>
            </div>

            <div className="pt-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestExpansion("backup")}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto font-semibold"
              >
                Configure Custom Retention <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
