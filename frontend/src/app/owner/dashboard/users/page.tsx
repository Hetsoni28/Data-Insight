import dynamic from "next/dynamic"
﻿﻿"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Users,
  Plus,
  Download,
  Mail,
  Shield,
  Loader2,
  Building2,
  Copy,
  Check,
  RotateCw,
  Ban,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import api from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const UsersDataGrid = dynamic(() => import('@/components/organisms/UsersDataGrid').then(m => m.UsersDataGrid), { ssr: false })


interface TenantOption {
  id: string
  name: string
  slug: string
}

interface PlatformInvitation {
  id: string
  email: string
  role: string
  status: "pending" | "accepted" | "revoked" | string
  tenant_id?: string
  tenant_name?: string
  token?: string
  invite_url?: string
  expires_at: string
  created_at: string
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "invitations">("users")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("analyst")
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)

  // Success Link Modal State
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)

  // Invitations List State
  const [invitations, setInvitations] = useState<PlatformInvitation[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [inviteSearch, setInviteSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch tenants for dropdown
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoadingTenants(true)
        const { data } = await api.get("/admin/tenants")
        const list = Array.isArray(data) ? data : data?.data || []
        setTenants(list)
        if (list.length > 0 && !selectedTenantId) {
          setSelectedTenantId(list[0].id)
        }
      } catch (err) {
        console.error("Failed to load organizations for invite selector", err)
      } finally {
        setLoadingTenants(false)
      }
    }
    fetchTenants()
  }, [])

  // Fetch platform invitations
  const fetchInvitations = async () => {
    try {
      setLoadingInvites(true)
      const { data } = await api.get<PlatformInvitation[]>("/invitations")
      setInvitations(data || [])
    } catch (err) {
      console.error("Failed to fetch platform invitations", err)
    } finally {
      setLoadingInvites(false)
    }
  }

  useEffect(() => {
    if (activeTab === "invitations") {
      fetchInvitations()
    }
  }, [activeTab, refreshKey])

  const handleExport = async () => {
    setIsExporting(true)
    toast.info("Generating users CSV...")
    try {
      const { data } = await api.get("/admin/users")
      if (!data || data.length === 0) {
        toast.error("No users to export.")
        return
      }
      const headers = ["ID", "Full Name", "Email", "Role", "Organization", "Status", "Joined At"]
      const csvRows = [headers.join(",")]
      data.forEach((u: any) => {
        csvRows.push([
          u.id,
          `"${u.full_name || u.name || ""}"`,
          u.email,
          u.role,
          `"${u.tenant_name || u.organization || ""}"`,
          u.is_active ? "Active" : !u.tenant_id ? "Pending Approval" : "Suspended",
          u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
        ].join(","))
      })
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `platform_users_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`Exported ${data.length} users successfully.`)
    } catch {
      toast.error("Failed to export users. Check API connection.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }
    setIsInviting(true)
    try {
      const { data } = await api.post("/invitations", {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        tenant_id: selectedTenantId || undefined,
      })

      const inviteUrl = data.invite_url || `${window.location.origin}/invite/${data.token}`
      setCreatedInviteUrl(inviteUrl)
      setIsInviteOpen(false)
      setInviteEmail("")
      setInviteRole("analyst")
      setRefreshKey((k) => k + 1)
      toast.success(`Invitation created for ${data.email}`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || "Failed to send invitation."
      toast.error(msg)
    } finally {
      setIsInviting(false)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setHasCopiedLink(true)
    toast.success("Invitation link copied to clipboard!")
    setTimeout(() => setHasCopiedLink(false), 2000)
  }

  const handleResendInvite = async (id: string, email: string) => {
    setActionLoadingId(id)
    try {
      const { data } = await api.post(`/invitations/${id}/resend`)
      toast.success(`Invitation renewed & resent to ${email}`, {
        description: "Token validity extended by 7 days.",
      })
      if (data.invite_url) {
        handleCopyLink(data.invite_url)
      }
      fetchInvitations()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to resend invitation.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRevokeInvite = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${email}?`)) return
    setActionLoadingId(id)
    try {
      await api.patch(`/invitations/${id}/revoke`)
      toast.success(`Invitation for ${email} revoked.`)
      fetchInvitations()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to revoke invitation.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      const matchesSearch =
        inv.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
        (inv.tenant_name && inv.tenant_name.toLowerCase().includes(inviteSearch.toLowerCase())) ||
        inv.role.toLowerCase().includes(inviteSearch.toLowerCase())
      const matchesStatus = statusFilter === "all" || inv.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [invitations, inviteSearch, statusFilter])

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            Platform User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Manage all active individuals and global invitations across all tenant organizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="h-9 px-4 rounded-md bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 shadow-sm hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2",
            activeTab === "users"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Users className="w-4 h-4" />
          Active Members
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold transition-all border-b-2 flex items-center gap-2",
            activeTab === "invitations"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Mail className="w-4 h-4" />
          Platform Invitations
          {invitations.filter((i) => i.status === "pending").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-bold">
              {invitations.filter((i) => i.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Users Grid */}
      {activeTab === "users" && (
        <motion.div
          key={refreshKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <UsersDataGrid />
        </motion.div>
      )}

      {/* Tab 2: Global Invitations Center */}
      {activeTab === "invitations" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search email, organization, role..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                disabled={loadingInvites}
                className="h-9"
              >
                <RotateCw className={cn("w-3.5 h-3.5 mr-1.5", loadingInvites && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                    <th className="px-6 py-3.5">Recipient</th>
                    <th className="px-6 py-3.5">Organization</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Expires</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {loadingInvites ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading platform invitations...
                      </td>
                    </tr>
                  ) : filteredInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        No invitations found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvitations.map((inv) => {
                      const isExpired = new Date(inv.expires_at) < new Date() && inv.status === "pending"
                      const directUrl = inv.invite_url || `${window.location.origin}/invite/${inv.token}`

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {inv.email}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Created {new Date(inv.created_at).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {inv.tenant_name || "Platform"}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                              {inv.role}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {inv.status === "pending" && !isExpired && (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-400/20">
                                <Clock className="w-3.5 h-3.5" /> Pending
                              </span>
                            )}
                            {inv.status === "pending" && isExpired && (
                              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 px-2.5 py-1 rounded-full text-xs font-medium border border-rose-200 dark:border-rose-400/20">
                                <XCircle className="w-3.5 h-3.5" /> Expired
                              </span>
                            )}
                            {inv.status === "accepted" && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-400/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                              </span>
                            )}
                            {inv.status === "revoked" && (
                              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium">
                                <Ban className="w-3.5 h-3.5" /> Revoked
                              </span>
                            )}
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
                                    className="h-8 px-2.5 text-xs gap-1 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-700"
                                    title="Copy direct invite link"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Link
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoadingId === inv.id}
                                    onClick={() => handleResendInvite(inv.id, inv.email)}
                                    className="h-8 px-2.5 text-xs gap-1 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-emerald-50 hover:text-emerald-700"
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
                                    onClick={() => handleRevokeInvite(inv.id, inv.email)}
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
        </motion.div>
      )}

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-emerald-600" />
              Invite User to Platform
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Create an invitation for a team member to join a specific tenant organization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
                required
                autoFocus
                className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
              />
            </div>

            {/* Target Organization Selector for Owner */}
            <div className="space-y-2">
              <Label htmlFor="invite-tenant" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                Target Organization
              </Label>
              <select
                id="invite-tenant"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                disabled={isInviting || loadingTenants}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                Assigned Role
              </Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={isInviting}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="analyst">Analyst — Data modeling & analysis</option>
                <option value="manager">Manager — Team & workflow management</option>
                <option value="org_admin">Org Admin — Full tenant control</option>
                <option value="viewer">Viewer — Read-only access</option>
              </select>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Generate & Send Invite
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
        <DialogContent className="sm:max-w-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Invitation Link Ready
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              The invitation email has been queued. You can also copy the secure direct link below and share it directly via Slack, Teams, or message.
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
              ⏱ This secure invitation link is valid for 7 days.
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
