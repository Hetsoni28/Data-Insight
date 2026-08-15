"use client"

import { motion } from "framer-motion"
import {
  HardDrive, Cpu, Users, BarChart3,
  FileStack, LayoutDashboard, AlertTriangle,
  CheckCircle2, Zap, TrendingUp
} from "lucide-react"
import type { BillingUsage, UsageMeterData } from "@/lib/billing.service"

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNumber(n: number, unit?: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${unit ? ` ${unit}` : ""}`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K${unit ? ` ${unit}` : ""}`
  return `${n}${unit ? ` ${unit}` : ""}`
}

function getBarColor(state: UsageMeterData["warningState"]): string {
  switch (state) {
    case "limit":    return "bg-rose-500"
    case "critical": return "bg-rose-400"
    case "high":     return "bg-amber-400"
    case "warning":  return "bg-amber-300"
    default:         return "bg-emerald-500"
  }
}

function getStateLabel(state: UsageMeterData["warningState"]): { label: string; className: string } {
  switch (state) {
    case "limit":    return { label: "Limit Reached",  className: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" }
    case "critical": return { label: "Critical",       className: "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" }
    case "high":     return { label: "High Usage",     className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" }
    case "warning":  return { label: "Warning",        className: "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" }
    default:         return { label: "Healthy",        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" }
  }
}

// ── Single Meter Card ─────────────────────────────────────────────────────────
interface MeterCardProps {
  label: string
  icon: any
  meter: UsageMeterData
  usedLabel: string
  limitLabel: string
  delay?: number
}

function MeterCard({ label, icon: Icon, meter, usedLabel, limitLabel, delay = 0 }: MeterCardProps) {
  const barColor = getBarColor(meter.warningState)
  const state = getStateLabel(meter.warningState)
  const pct = Math.min(meter.pct, 100)
  const isUnlimited = meter.limit === null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{label}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {isUnlimited ? "Unlimited allocation" : `${usedLabel} of ${limitLabel}`}
            </p>
          </div>
        </div>
        {isUnlimited ? (
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-2.5 py-1 rounded-full">
            Unlimited
          </span>
        ) : (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${state.className}`}>
            {state.label}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
              className={`h-full rounded-full ${barColor} transition-all`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{pct.toFixed(1)}% used</span>
            {meter.remaining !== null && (
              <span className="text-[11px] text-slate-400">
                {fmtNumber(meter.remaining)} remaining
              </span>
            )}
          </div>
        </div>
      )}

      {/* Unlimited sparkle */}
      {isUnlimited && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            No limit on your dedicated system rental plan
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  usage: BillingUsage
}

export function BillingUsageMeters({ usage }: Props) {
  const meters = [
    {
      key: "storage",
      label: "Storage",
      icon: HardDrive,
      meter: usage.storage,
      usedLabel: `${usage.storage.used} GB`,
      limitLabel: usage.storage.limit ? `${usage.storage.limit} GB` : "∞",
    },
    {
      key: "aiTokens",
      label: "AI Tokens",
      icon: Cpu,
      meter: usage.aiTokens,
      usedLabel: fmtNumber(usage.aiTokens.used),
      limitLabel: usage.aiTokens.limit ? fmtNumber(usage.aiTokens.limit) : "∞",
    },
    {
      key: "members",
      label: "Team Members",
      icon: Users,
      meter: usage.members,
      usedLabel: `${usage.members.used} users`,
      limitLabel: usage.members.limit ? `${usage.members.limit} users` : "∞",
    },
    {
      key: "datasets",
      label: "Datasets",
      icon: FileStack,
      meter: usage.datasets,
      usedLabel: `${usage.datasets.used}`,
      limitLabel: usage.datasets.limit ? `${usage.datasets.limit}` : "∞",
    },
    {
      key: "reports",
      label: "Reports",
      icon: BarChart3,
      meter: usage.reports,
      usedLabel: `${usage.reports.used}`,
      limitLabel: usage.reports.limit ? `${usage.reports.limit}` : "∞",
    },
    {
      key: "dashboards",
      label: "Dashboards",
      icon: LayoutDashboard,
      meter: usage.dashboards,
      usedLabel: `${usage.dashboards.used}`,
      limitLabel: usage.dashboards.limit ? `${usage.dashboards.limit}` : "∞",
    },
  ]

  // Check for any alerts
  const hasWarnings = meters.some(
    (m) => m.meter.warningState === "warning" || m.meter.warningState === "high" ||
            m.meter.warningState === "critical" || m.meter.warningState === "limit"
  )

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Live Usage Meters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time resource consumption across your dedicated system allocation
          </p>
        </div>
        {hasWarnings && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold">Usage Alert</span>
          </div>
        )}
      </div>

      {/* Meter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {meters.map((m, i) => (
          <MeterCard
            key={m.key}
            label={m.label}
            icon={m.icon}
            meter={m.meter}
            usedLabel={m.usedLabel}
            limitLabel={m.limitLabel}
            delay={i * 0.06}
          />
        ))}
      </div>
    </div>
  )
}
