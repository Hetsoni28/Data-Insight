"use client"

import { toast } from "sonner"
import { motion } from "framer-motion"
import { Plus, Shield, Check, X, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TeamRoleManager({ roles }: { roles: any[] }) {
  // Hardcoded for visual matrix demo
  const systemRoles = [
    { name: "Organization Admin", desc: "Full control over organization", isSystem: true, color: "text-rose-500" },
    { name: "Manager", desc: "Can manage team and billing", isSystem: true, color: "text-blue-500" },
    { name: "Analyst", desc: "Can view and edit datasets", isSystem: true, color: "text-emerald-500" },
    { name: "Viewer", desc: "Read-only access", isSystem: true, color: "text-slate-400" }
  ]

  const permissions = [
    "Manage Organization Settings",
    "Manage Billing & Invoices",
    "Invite & Manage Users",
    "Create & Edit Datasets",
    "View Dashboards & Reports",
    "Export Data",
    "Manage API Keys"
  ]

  const hasPerm = (roleName: string, permIdx: number) => {
    if (roleName === "Organization Admin") return true
    if (roleName === "Manager" && permIdx !== 0) return true
    if (roleName === "Analyst" && permIdx >= 3) return true
    if (roleName === "Viewer" && permIdx === 4) return true
    return false
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Lock className="w-5 h-5 text-emerald-500" />
            Role-Based Access Control (RBAC)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Define custom roles and manage organization permission matrices.</p>
        </div>
        <motion.div onClick={() => toast.info("Custom roles feature coming soon")} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20">
            <Plus className="w-4 h-4" />
            Create Custom Role
          </Button>
        </motion.div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 w-64 uppercase tracking-wider font-bold text-[11px]">Permission</th>
              {systemRoles.map(role => (
                <th key={role.name} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 shadow-2xs mb-1">
                      <Shield className={`w-4 h-4 ${role.color}`} />
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-xs">{role.name}</span>
                    {role.isSystem && <span className="text-[9px] font-extrabold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">SYSTEM</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {permissions.map((perm, idx) => (
              <tr key={perm} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {perm}
                </td>
                {systemRoles.map(role => (
                  <td key={role.name} className="px-6 py-4 text-center">
                    {hasPerm(role.name, idx) ? (
                      <div className="w-7 h-7 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-500/30 shadow-2xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 mx-auto rounded-full bg-slate-100/50 dark:bg-white/5 flex items-center justify-center opacity-30">
                        <X className="w-4 h-4 text-slate-400 stroke-[2]" />
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
