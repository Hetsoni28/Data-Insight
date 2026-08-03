"use client"

import { useState } from "react"
import { Users, Plus, Download, Mail, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsersDataGrid } from "@/components/organisms/UsersDataGrid"
import { motion } from "framer-motion"
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

export default function UsersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("analyst")
  const [refreshKey, setRefreshKey] = useState(0)

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
          u.is_active ? "Active" : "Suspended",
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
      await api.post("/invitations", {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      })
      toast.success(`Invitation sent to ${inviteEmail}`, {
        description: `They will receive an email to join the platform as ${inviteRole}.`,
      })
      setIsInviteOpen(false)
      setInviteEmail("")
      setInviteRole("analyst")
      setRefreshKey(k => k + 1)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to send invitation."
      toast.error(msg)
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            Platform Users
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Manage all registered individuals across all organizations.
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
            className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      <motion.div
        key={refreshKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <UsersDataGrid />
      </motion.div>

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Invite User to Platform
            </DialogTitle>
            <DialogDescription>
              Send an email invitation to join Data Insight. They will be able to set their own password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                Platform Role
              </Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={isInviting}
                className="w-full h-10 rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-card px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <option value="analyst">Analyst — View &amp; analyze data</option>
                <option value="manager">Manager — Manage team &amp; data</option>
                <option value="org_admin">Org Admin — Full organization control</option>
              </select>
              <p className="text-xs text-slate-500">
                Owner role can only be assigned directly in the database.
              </p>
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
