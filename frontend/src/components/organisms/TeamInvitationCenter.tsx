"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  Plus,
  X,
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  RotateCw,
  Ban,
  XCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

export function TeamInvitationCenter({ roles }: { roles: any[] }) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [selectedRole, setSelectedRole] = useState("analyst")

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Success Link Modal State
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const res = await api.get("/tenant-team/invitations")
      setInvitations(res.data.data || [])
    } catch (e) {
      console.error("Failed to fetch invitations", e)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !selectedRole) return
    setIsSending(true)
    try {
      const res = await api.post("/tenant-team/invitations", {
        email: email.trim().toLowerCase(),
        role: selectedRole,
      })

      const data = res.data?.data || res.data
      const inviteUrl = data.invite_url || `${window.location.origin}/invite/${data.token}`
      setCreatedInviteUrl(inviteUrl)
      setIsInviteModalOpen(false)
      setEmail("")
      setSelectedRole("analyst")
      fetchInvitations()
      toast.success(`Invitation created for ${data.email || email}`)
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        "Failed to send invitation. It might already exist."
      toast.error(msg)
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setHasCopiedLink(true)
    toast.success("Invitation link copied to clipboard!")
    setTimeout(() => setHasCopiedLink(false), 2000)
  }

  const handleResend = async (id: string, invEmail: string) => {
    setActionLoadingId(id)
    try {
      const res = await api.post(`/tenant-team/invitations/${id}/resend`)
      const data = res.data?.data || res.data
      toast.success(`Invitation renewed & resent to ${invEmail}`, {
        description: "Token validity extended by 7 days.",
      })
      if (data.invite_url) {
        handleCopyLink(data.invite_url)
      }
      fetchInvitations()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to resend invitation.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRevoke = async (id: string, invEmail: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${invEmail}?`)) return
    setActionLoadingId(id)
    try {
      await api.patch(`/tenant-team/invitations/${id}/revoke`)
      toast.success(`Invitation for ${invEmail} revoked.`)
      fetchInvitations()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to revoke invitation.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const matchesSearch =
        inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.role.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === "all" || inv.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [invitations, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <Mail className="w-4 h-4" />
            </div>
            Team Invitation Center
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Invite colleagues, manage pending access, and generate direct invitation links.
          </p>
        </div>
        <motion.div onClick={() => setIsInviteModalOpen(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2 shadow-md shadow-emerald-500/20 font-bold text-xs rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            Invite Team Member
          </Button>
        </motion.div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs font-medium bg-white dark:bg-black/20 border-slate-200/80 dark:border-white/10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="revoked">Revoked</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvitations}
            disabled={loading}
            className="h-9 rounded-xl font-bold text-xs dark:border-white/10"
          >
            <RotateCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Intended Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Sent Date</th>
                <th className="px-6 py-3.5">Expires</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading invitations...
                  </td>
                </tr>
              ) : filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    No team invitations found.
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => {
                  const isExpired =
                    new Date(inv.expires_at) < new Date() && inv.status === "pending"
                  const directUrl =
                    inv.invite_url || `${window.location.origin}/invite/${inv.token}`

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {inv.email}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {inv.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {inv.status === "pending" && !isExpired && (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-400/20">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                        {inv.status === "pending" && isExpired && (
                          <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 px-2.5 py-1 rounded-full text-xs font-medium border border-rose-200 dark:border-rose-400/20">
                            <XCircle className="w-3.5 h-3.5" /> Expired
                          </span>
                        )}
                        {inv.status === "accepted" && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-400/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                          </span>
                        )}
                        {inv.status === "revoked" && (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium">
                            <Ban className="w-3.5 h-3.5" /> Revoked
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyLink(directUrl)}
                                className="h-8 px-2.5 text-xs gap-1 bg-white dark:bg-card border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-700"
                                title="Copy direct invite link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Copy Link
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoadingId === inv.id}
                                onClick={() => handleResend(inv.id, inv.email)}
                                className="h-8 px-2.5 text-xs gap-1 bg-white dark:bg-card border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-700"
                                title="Extend expiration and resend email"
                              >
                                <RotateCw
                                  className={cn(
                                    "w-3.5 h-3.5",
                                    actionLoadingId === inv.id && "animate-spin"
                                  )}
                                />
                                Resend
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoadingId === inv.id}
                                onClick={() => handleRevoke(inv.id, inv.email)}
                                className="h-8 px-2.5 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200 dark:border-white/10"
                                title="Revoke invitation"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Revoke
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-card border border-slate-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Invite a new colleague to collaborate on datasets and dashboards.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                required
                autoFocus
                className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                placeholder="colleague@company.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Assigned Role <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isSending}
                className="w-full h-10 px-3 bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="analyst">Analyst - Data modeling & exploration</option>
                <option value="manager">Manager - Team & workflow oversight</option>
                <option value="org_admin">Org Admin - Full organization settings & team</option>
                <option value="viewer">Viewer - Read-only dashboards</option>
              </select>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteModalOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!email || !selectedRole || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Direct Link Modal */}
      <Dialog
        open={Boolean(createdInviteUrl)}
        onOpenChange={(open) => !open && setCreatedInviteUrl(null)}
      >
        <DialogContent className="sm:max-w-lg bg-white dark:bg-card border border-slate-200 dark:border-white/10">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Invitation Link Ready
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              The invitation email has been sent. You can also copy the secure direct link below and share it directly via Slack, Teams, or email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
              <Input
                readOnly
                value={createdInviteUrl || ""}
                className="bg-transparent border-0 text-xs font-mono text-slate-700 dark:text-slate-300 focus-visible:ring-0 select-all"
              />
              <Button
                size="sm"
                onClick={() => createdInviteUrl && handleCopyLink(createdInviteUrl)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5"
              >
                {hasCopiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {hasCopiedLink ? "Copied" : "Copy Link"}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              ? This secure invitation link is valid for 7 days.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setCreatedInviteUrl(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
