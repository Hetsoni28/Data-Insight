import { useState, useEffect } from "react"
import { Mail, Plus, X, UserPlus, Search, Shield, ChevronDown, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

export function TeamInvitationCenter({ roles }: { roles: any[] }) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  
  const [email, setEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState("")

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const res = await api.get("/tenant-team/invitations")
      setInvitations(res.data.data)
    } catch (e) {
      console.error("Failed to fetch invitations", e)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!email || !selectedRole) return
    try {
      await api.post("/tenant-team/invitations", { email, role: selectedRole })
      setIsInviteModalOpen(false)
      setEmail("")
      setSelectedRole("")
      fetchInvitations()
    } catch (e) {
      console.error(e)
      alert("Failed to send invitation. It might already exist or an error occurred.")
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return
    try {
      await api.patch(`/tenant-team/invitations/${id}/revoke`)
      fetchInvitations()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-500" />
            Invitation Center
          </h3>
          <p className="text-sm text-slate-500">Manage pending and historical invites to your organization.</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-black/20">
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Intended Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Sent At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading invitations...</td></tr>
            ) : invitations.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No invitations found.</td></tr>
            ) : (
              invitations.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{inv.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-white/10">
                      {inv.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === "pending" && <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-full text-xs font-medium"><Clock className="w-3.5 h-3.5" /> Pending</span>}
                    {inv.status === "accepted" && <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-full text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Accepted</span>}
                    {inv.status === "revoked" && <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 px-2.5 py-1 rounded-full text-xs font-medium"><X className="w-3.5 h-3.5" /> Revoked</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    {inv.status === "pending" && (
                      <button onClick={() => handleRevoke(inv.id)} className="text-rose-600 hover:text-rose-700 text-sm font-medium">Revoke</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Invite New Member</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select a role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                  <option value="manager">Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <Button onClick={handleInvite} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2" disabled={!email || !selectedRole}>
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
