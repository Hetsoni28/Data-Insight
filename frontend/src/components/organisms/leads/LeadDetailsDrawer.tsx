"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mail, Phone, Building2, Zap, Users, HardDrive, Database, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import api from "@/lib/api"
import { toast } from "sonner"

// ── Types ─────────────────────────────────────────────────────────────────────
export type LeadStatus = "new" | "contacted" | "demo" | "negotiation" | "approved" | "provisioning" | "active" | "rejected"

export interface Lead {
  id: string
  lead_id: string
  company_name: string
  contact_person: string
  business_email: string
  phone: string | null
  company_size: string | null
  industry: string | null
  expected_users: number | null
  expected_storage_gb: number | null
  expected_data_volume: string | null
  ai_bi_requirements: string | null
  preferred_contact_time: string | null
  message: string | null
  status: LeadStatus
  source: string
  internal_notes: string | null
  assigned_to: string | null
  tenant_id: string | null
  created_at: string
  updated_at: string
  contacted_at: string | null
  demo_at: string | null
  approved_at: string | null
  rejected_at: string | null
}

export const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new:          { label: "New",          color: "text-blue-700 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-500/10",   border: "border-blue-200 dark:border-blue-500/20" },
  contacted:    { label: "Contacted",    color: "text-violet-700 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20" },
  demo:         { label: "Demo",         color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-200 dark:border-amber-500/20" },
  negotiation:  { label: "Negotiation",  color: "text-orange-700 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/20" },
  approved:     { label: "Approved",     color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10",border: "border-emerald-200 dark:border-emerald-500/20" },
  provisioning: { label: "Provisioning", color: "text-teal-700 dark:text-teal-400",    bg: "bg-teal-50 dark:bg-teal-500/10",   border: "border-teal-200 dark:border-teal-500/20" },
  active:       { label: "Active",       color: "text-green-700 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-500/10",  border: "border-green-200 dark:border-green-500/20" },
  rejected:     { label: "Rejected",     color: "text-rose-700 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-500/10",   border: "border-rose-200 dark:border-rose-500/20" },
}

export const PIPELINE_ORDER: LeadStatus[] = ["new","contacted","demo","negotiation","approved","provisioning","active","rejected"]

export function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

export function LeadDetailsDrawer({ lead, onClose, onRefresh }: {
  lead: Lead | null; onClose: () => void; onRefresh: () => void
}) {
  const [newStatus, setNewStatus] = useState<LeadStatus | "">("")
  const [notes, setNotes] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const qc = useQueryClient()

  // Reset local state when lead changes
  useState(() => {
    if (lead) {
      setNotes(lead.internal_notes || "")
      setAssignedTo(lead.assigned_to || "")
      setNewStatus(lead.status)
    }
  })

  const statusMutation = useMutation({
    mutationFn: (status: LeadStatus) =>
      api.patch(`/leads/${lead!.lead_id}/status`, {
        status,
        internal_notes: notes || undefined,
        assigned_to: assignedTo || undefined
      }),
    onSuccess: () => {
      toast.success("Status updated.")
      qc.invalidateQueries({ queryKey: ["owner-leads"] })
      qc.invalidateQueries({ queryKey: ["owner-leads-stats"] })
      onRefresh()
    },
    onError: () => toast.error("Failed to update status."),
  })

  const notesMutation = useMutation({
    mutationFn: () =>
      api.patch(`/leads/${lead!.lead_id}/notes`, {
        internal_notes: notes, assigned_to: assignedTo || undefined
      }),
    onSuccess: () => { toast.success("Notes saved."); onRefresh() },
    onError: () => toast.error("Failed to save notes."),
  })

  if (!lead) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 w-full max-w-xl shadow-2xl overflow-y-auto h-full flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 p-6 z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{lead.lead_id}</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{lead.company_name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{lead.contact_person} · {lead.business_email}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Contact Info */}
            <section className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contact Information</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: "Email", value: lead.business_email },
                  { icon: Phone, label: "Phone", value: lead.phone || "—" },
                  { icon: Building2, label: "Company Size", value: lead.company_size || "—" },
                  { icon: Zap, label: "Industry", value: lead.industry || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Capacity Requirements */}
            <section className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Capacity Requirements</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: "Users", value: lead.expected_users ? `${lead.expected_users}` : "—" },
                  { icon: HardDrive, label: "Storage", value: lead.expected_storage_gb ? `${lead.expected_storage_gb} GB` : "—" },
                  { icon: Database, label: "Data Volume", value: lead.expected_data_volume || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-center">
                    <Icon className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{value}</p>
                    <p className="text-[10px] font-semibold text-emerald-500/80 dark:text-emerald-500/60 uppercase tracking-wider mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            {(lead.ai_bi_requirements || lead.message) && (
              <section className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Requirements</h3>
                {lead.ai_bi_requirements && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI/BI Requirements</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{lead.ai_bi_requirements}</p>
                  </div>
                )}
                {lead.message && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2">Message</p>
                    <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{lead.message}</p>
                  </div>
                )}
              </section>
            )}

            {/* Timeline */}
            <section className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Timeline</h3>
              <div className="space-y-2">
                {[
                  { label: "Submitted", date: lead.created_at },
                  { label: "Contacted", date: lead.contacted_at },
                  { label: "Demo Scheduled", date: lead.demo_at },
                  { label: "Approved", date: lead.approved_at },
                  { label: "Rejected", date: lead.rejected_at },
                ].map(({ label, date }) => (
                  <div key={label} className={`flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-white/5 ${!date ? "opacity-40" : ""}`}>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{label}</span>
                    <span className={`font-bold ${date ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>{fmtDate(date)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Action Area */}
          <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200/60 dark:border-white/10 space-y-4 shrink-0">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Pipeline Management</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Assigned To</Label>
                <Input
                  placeholder="Sales rep name..."
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="rounded-xl border-slate-200/60 dark:border-white/10 dark:bg-white/5 text-sm h-10"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as LeadStatus)}>
                  <SelectTrigger className="rounded-xl border-slate-200/60 dark:border-white/10 dark:bg-white/5 text-sm h-10">
                    <SelectValue placeholder="Move to status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_ORDER.map(s => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Internal Notes</Label>
              <Textarea
                placeholder="Add notes about this lead..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="rounded-xl border-slate-200/60 dark:border-white/10 dark:bg-white/5 text-sm resize-none h-24"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => newStatus && statusMutation.mutate(newStatus as LeadStatus)}
                disabled={!newStatus || statusMutation.isPending || (newStatus === lead.status && notes === (lead.internal_notes || "") && assignedTo === (lead.assigned_to || ""))}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm h-11"
              >
                {statusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Lead
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
