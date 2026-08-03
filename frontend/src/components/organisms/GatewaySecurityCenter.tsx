"use client"
import { motion } from "framer-motion"
import { ShieldAlert, Fingerprint, Lock, ShieldCheck } from "lucide-react"

interface GatewaySecurityCenterProps {
  security: any;
}

export function GatewaySecurityCenter({ security }: GatewaySecurityCenterProps) {
  if (!security) return null

  const items = [
    {
      title: "Rate Limit Violations",
      value: security.rate_limit_violations,
      desc: "Requests rejected with 429",
      icon: ShieldAlert,
      color: "amber"
    },
    {
      title: "Auth Failures",
      value: security.authentication_failures,
      desc: "Invalid API Keys or JWTs",
      icon: Lock,
      color: "red"
    },
    {
      title: "Blocked IPs",
      value: security.blocked_ips_count,
      desc: "Actively blocked by WAF",
      icon: Fingerprint,
      color: "purple"
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl p-6 shadow-sm"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Security Center</h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Protection Active
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.title} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full bg-${item.color}-100 dark:bg-${item.color}-500/20 flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
