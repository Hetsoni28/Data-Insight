"use client"

import { useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Shield, Check, X, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

const SYSTEM_ROLES = [
  { name: "Organization Admin", desc: "Full control over organization", color: "text-rose-500", isSystem: true },
  { name: "Manager",            desc: "Can manage team and billing",    color: "text-blue-500",  isSystem: true },
  { name: "Analyst",            desc: "Can view and edit datasets",      color: "text-emerald-500", isSystem: true },
  { name: "Viewer",             desc: "Read-only access",               color: "text-slate-400",   isSystem: true },
]

const PERMISSIONS = [
  "Manage Organization Settings",
  "Manage Billing & Invoices",
  "Invite & Manage Users",
  "Create & Edit Datasets",
  "View Dashboards & Reports",
  "Export Data",
  "Manage API Keys",
]

function hasPerm(roleName: string, permIdx: number): boolean {
  if (roleName === "Organization Admin") return true
  if (roleName === "Manager" && permIdx !== 0) return true
  if (roleName === "Analyst" && permIdx >= 3) return true
  if (roleName === "Viewer" && permIdx === 4) return true
  return false
}

interface CustomRole { id: string; name: string; description?: string }

export function TeamRoleManager({ roles }: { roles: CustomRole[] }) {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(roles ?? [])
  const [showModal, setShowModal] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDesc, setNewRoleDesc] = useState("")
  const [creating, setCreating] = useState(false)

  const allRoles = [
    ...SYSTEM_ROLES,
    ...customRoles.map(r => ({ name: r.name, desc: r.description ?? "", color: "text-purple-500", isSystem: false })),
  ]

  const handleCreate = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required")
      return
    }
    setCreating(true)
    try {
      const res = await api.post("/tenant-roles", { name: newRoleName.trim(), description: newRoleDesc.trim() })
      const created = res.data?.data ?? res.data
      setCustomRoles(prev => [...prev, created])
      toast.success(`Role "${newRoleName.trim()}" created successfully`)
      setShowModal(false)
      setNewRoleName("")
      setNewRoleDesc("")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? "Failed to create role")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Lock className="w-5 h-5 text-emerald-500" />
            Role-Based Access Control (RBAC)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Define custom roles and manage organization permission matrices.</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={() => setShowModal(true)}
            className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </Button>
        </motion.div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 w-64 uppercase tracking-wider font-bold text-[11px]">Permission</th>
              {allRoles.map(role => (
                <th key={role.name} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 shadow-2xs mb-1">
                      <Shield className={`w-4 h-4 ${role.color}`} />
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-xs">{role.name}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      role.isSystem
                        ? "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                        : "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
                    }`}>
                      {role.isSystem ? "SYSTEM" : "CUSTOM"}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {PERMISSIONS.map((perm, idx) => (
              <tr key={perm} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {perm}
                </td>
                {allRoles.map(role => (
                  <td key={role.name} className="px-6 py-4 text-center">
                    {hasPerm(role.name, idx) || !role.isSystem ? (
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

      {/* Create Role Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 w-full max-w-md space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                  <Shield className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Custom Role</h3>
                  <p className="text-xs text-slate-500">This role will be available to assign to team members.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Role Name *</label>
                  <input
                    autoFocus
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="e.g. Data Engineer"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Description</label>
                  <input
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                    placeholder="Brief description of this role's responsibilities"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl text-sm font-semibold" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !newRoleName.trim()}
                  className="flex-1 rounded-xl text-sm font-bold bg-purple-500 hover:bg-purple-400 text-white gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
