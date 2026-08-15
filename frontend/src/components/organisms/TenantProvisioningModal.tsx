"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield, Server, Database, CheckCircle2,
  AlertTriangle, Loader2, Eye, EyeOff,
  Lock, Unlock, X, HardDrive, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"

// ── Status Badge ──────────────────────────────────────────────────────────────
function ProvisioningBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: any }> = {
    none:         { label: "Not Provisioned",  className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",        icon: Database },
    pending:      { label: "Pending",           className: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",     icon: Loader2 },
    provisioning: { label: "Provisioning...",   className: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",            icon: Loader2 },
    ready:        { label: "Dedicated — Ready", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: CheckCircle2 },
    failed:       { label: "Failed",            className: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",         icon: AlertTriangle },
  }
  const c = config[status] ?? config.none
  const Icon = c.icon
  return (
    <Badge className={`text-[10px] font-bold uppercase flex items-center gap-1 px-2.5 py-1 ${c.className}`}>
      <Icon className={`h-3 w-3 ${status === "provisioning" || status === "pending" ? "animate-spin" : ""}`} />
      {c.label}
    </Badge>
  )
}

// ── Security Info Card ────────────────────────────────────────────────────────
function SecurityNote() {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
      <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">End-to-End Secure</p>
        <ul className="text-[11px] text-emerald-700 dark:text-emerald-400 space-y-0.5">
          <li>• Connection validated before anything is saved</li>
          <li>• URL encrypted with AES-256 Fernet — never stored in plain text</li>
          <li>• Raw URL never returned to the browser, only status</li>
          <li>• Every action written to the immutable audit log</li>
        </ul>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  tenantId: string
  tenantName: string
  isOpen: boolean
  onClose: () => void
}

export function TenantProvisioningModal({ tenantId, tenantName, isOpen, onClose }: Props) {
  const [dbUrl, setDbUrl] = useState("")
  const [bucketName, setBucketName] = useState("")
  const [showUrl, setShowUrl] = useState(false)
  const [confirmDeprovision, setConfirmDeprovision] = useState(false)
  const queryClient = useQueryClient()

  // ── Fetch current provisioning status ─────────────────────────────────────
  const { data: status, isLoading: isStatusLoading } = useQuery({
    queryKey: ["provisioning-status", tenantId],
    queryFn: async () => {
      const res = await api.get(`/owner/subscriptions/${tenantId}/provisioning-status`)
      return res.data
    },
    enabled: isOpen && !!tenantId,
    refetchInterval: (query) => {
      const data = query?.state?.data as any
      return data?.provisioning_status === "provisioning" ? 3000 : false
    },
  })

  // ── Provision mutation ─────────────────────────────────────────────────────
  const provisionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/owner/subscriptions/${tenantId}/provision`, {
        db_url: dbUrl,
        bucket_name: bucketName || null,
      })
      return res.data
    },
    onSuccess: () => {
      toast.success(`✅ ${tenantName} provisioned. Dedicated DB is live.`)
      setDbUrl(""); setBucketName(""); setShowUrl(false)
      queryClient.invalidateQueries({ queryKey: ["provisioning-status", tenantId] })
      queryClient.invalidateQueries({ queryKey: ["owner-subscriptions-list"] })
      queryClient.invalidateQueries({ queryKey: ["owner-billing-activity"] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Provisioning failed."
      toast.error(`❌ ${msg}`)
    },
  })

  // ── Deprovision mutation ───────────────────────────────────────────────────
  const deprovisionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/owner/subscriptions/${tenantId}/deprovision`)
      return res.data
    },
    onSuccess: () => {
      toast.success(`${tenantName} reverted to shared database.`)
      setConfirmDeprovision(false)
      queryClient.invalidateQueries({ queryKey: ["provisioning-status", tenantId] })
      queryClient.invalidateQueries({ queryKey: ["owner-subscriptions-list"] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to deprovision.")
    },
  })

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dbUrl.trim()) { toast.error("Database URL is required."); return }
    provisionMutation.mutate()
  }

  const isProvisioned = status?.provisioning_status === "ready"
  const isBusy = provisionMutation.isPending || deprovisionMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-card border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Server className="h-4 w-4" />
            </div>
            Dedicated Database Provisioning
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Provision an isolated, dedicated PostgreSQL database for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{tenantName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Isolation Mode</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isStatusLoading ? "Loading..." : (
                    isProvisioned ? "Dedicated database — full isolation" : "Shared database — row-level isolation"
                  )}
                </p>
              </div>
            </div>
            {isStatusLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              : <ProvisioningBadge status={status?.provisioning_status ?? "none"} />
            }
          </div>

          {/* Status Details (when provisioned) */}
          {isProvisioned && status && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 text-center">
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Dedicated DB</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                  {status.has_dedicated_db ? "Configured & Encrypted" : "Not set"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 text-center">
                <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Storage Bucket</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                  {status.has_dedicated_bucket ? "Configured" : "Shared"}
                </p>
              </div>
            </div>
          )}

          {/* Security Note */}
          <SecurityNote />

          {/* Provision Form (only when not yet provisioned or failed) */}
          {!isProvisioned && (
            <form onSubmit={handleProvision} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Database URL <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showUrl ? "text" : "password"}
                    placeholder="postgresql://user:pass@host:5432/dbname"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    disabled={isBusy}
                    required
                    className="rounded-xl pr-10 font-mono text-xs border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUrl(!showUrl)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  This URL will be validated and then encrypted. It is never stored in plain text.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Storage Bucket Name
                  <span className="text-xs font-normal text-slate-400 ml-2">(optional)</span>
                </Label>
                <Input
                  placeholder="e.g. tenant-company-a-prod"
                  value={bucketName}
                  onChange={(e) => setBucketName(e.target.value)}
                  disabled={isBusy}
                  className="rounded-xl border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500/50"
                />
              </div>

              <Button
                type="submit"
                disabled={isBusy || !dbUrl.trim()}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-md shadow-emerald-500/20 h-11"
              >
                {provisionMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Validating & Provisioning...</>
                  : <><Shield className="h-4 w-4 mr-2" />Provision Dedicated Database</>
                }
              </Button>
            </form>
          )}

          {/* Deprovision (only when provisioned) */}
          {isProvisioned && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/10">
              {!confirmDeprovision ? (
                <button
                  onClick={() => setConfirmDeprovision(true)}
                  className="text-xs text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1.5 transition-colors"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Revert to shared database
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 space-y-3">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    ⚠️ This will clear the dedicated DB configuration. The client's data on their dedicated server is NOT deleted — you just remove the pointer.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"
                      onClick={() => setConfirmDeprovision(false)}
                      className="rounded-xl text-xs flex-1 border-slate-200 dark:border-white/10">
                      Cancel
                    </Button>
                    <Button size="sm"
                      onClick={() => deprovisionMutation.mutate()}
                      disabled={deprovisionMutation.isPending}
                      className="rounded-xl text-xs flex-1 bg-rose-500 hover:bg-rose-400 text-white">
                      {deprovisionMutation.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : "Confirm Revert"
                      }
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
