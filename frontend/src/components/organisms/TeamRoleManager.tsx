import { Plus, Shield, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TeamRoleManager({ roles }: { roles: any[] }) {
  // Hardcoded for visual matrix demo
  const systemRoles = [
    { name: "Organization Admin", desc: "Full control over organization", isSystem: true },
    { name: "Manager", desc: "Can manage team and billing", isSystem: true },
    { name: "Analyst", desc: "Can view and edit datasets", isSystem: true },
    { name: "Viewer", desc: "Read-only access", isSystem: true }
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
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Role-Based Access Control</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Define custom roles and manage permission matrices.</p>
        </div>
        <Button className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" />
          Create Custom Role
        </Button>
      </div>

      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-[#09090b] text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-6 py-4 w-64 uppercase tracking-wider">Permission</th>
              {systemRoles.map(role => (
                <th key={role.name} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Shield className={`w-4 h-4 ${role.name === 'Organization Admin' ? 'text-rose-500' : 'text-emerald-500'}`} />
                    <span className="text-slate-900 dark:text-white font-semibold">{role.name}</span>
                    {role.isSystem && <span className="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded">SYSTEM</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {permissions.map((perm, idx) => (
              <tr key={perm} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                  {perm}
                </td>
                {systemRoles.map(role => (
                  <td key={role.name} className="px-6 py-4 text-center">
                    {hasPerm(role.name, idx) ? (
                      <div className="w-6 h-6 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 mx-auto rounded-full flex items-center justify-center opacity-30">
                        <X className="w-4 h-4 text-slate-400" />
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
