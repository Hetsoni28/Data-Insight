"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, RefreshCw, Loader2, Building2, Mail, Phone,
  Users, HardDrive, Calendar, MessageSquare, Edit3,
  ChevronRight, Filter, CheckCircle2, XCircle, Eye,
  Clock, Zap, Database, ArrowRight, StickyNote
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { toast } from "sonner"

// ── Types ─────────────────────────────────────────────────────────────────────
type LeadStatus = "new" | "contacted" | "demo" | "negotiation" | "approved" | "provisioning" | "active" | "rejected"

interface Lead {
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

// ── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new:          { label: "New",          color: "text-blue-700",    bg: "bg-blue-50",   border: "border-blue-200" },
  contacted:    { label: "Contacted",    color: "text-violet-700",  bg: "bg-violet-50", border: "border-violet-200" },
  demo:         { label: "Demo",         color: "text-amber-700",   bg: "bg-amber-50",  border: "border-amber-200" },
  negotiation:  { label: "Negotiation",  color: "text-orange-700",  bg: "bg-orange-50", border: "border-orange-200" },
  approved:     { label: "Approved",     color: "text-emerald-700", bg: "bg-emerald-50",border: "border-emerald-200" },
  provisioning: { label: "Provisioning", color: "text-teal-700",    bg: "bg-teal-50",   border: "border-teal-200" },
  active:       { label: "Active",       color: "text-green-700",   bg: "bg-green-50",  border: "border-green-200" },
  rejected:     { label: "Rejected",     color: "text-rose-700",    bg: "bg-rose-50",   border: "border-rose-200" },
}

const PIPELINE_ORDER: LeadStatus[] = ["new","contacted","demo","negotiation","approved","provisioning","active","rejected"]

function StatusBadge({ status }: { status: LeadStatus }) {
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

// ── Lead Detail Drawer ────────────────────────────────────────────────────────
function LeadDetailDrawer({ lead, onClose, onRefresh }: {
  lead: Lead | null; onClose: () => void; onRefresh: () => void
}) {
  const [newStatus, setNewStatus] = useState<LeadStatus | "">("")
  const [notes, setNotes] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const qc = useQueryClient()

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
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative bg-white w-full max-w-xl shadow-2xl overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 p-6 z-10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1">{lead.lead_id}</p>
                <h2 className="text-xl font-black text-slate-900">{lead.company_name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{lead.contact_person} · {lead.business_email}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Contact Info */}
            <section className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Contact Information</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: "Email", value: lead.business_email },
                  { icon: Phone, label: "Phone", value: lead.phone || "—" },
                  { icon: Building2, label: "Company Size", value: lead.company_size || "—" },
                  { icon: Zap, label: "Industry", value: lead.industry || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 break-all">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Capacity Requirements */}
            <section className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Capacity Requirements</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Users, label: "Users", value: lead.expected_users ? `${lead.expected_users}` : "—" },
                  { icon: HardDrive, label: "Storage", value: lead.expected_storage_gb ? `${lead.expected_storage_gb} GB` : "—" },
                  { icon: Database, label: "Data Volume", value: lead.expected_data_volume || "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <Icon className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-700">{value}</p>
                    <p className="text-[10px] text-emerald-500">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Requirements */}
            {(lead.ai_bi_requirements || lead.message) && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Requirements</h3>
                {lead.ai_bi_requirements && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI/BI Requirements</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{lead.ai_bi_requirements}</p>
                  </div>
                )}
                {lead.message && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Message</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{lead.message}</p>
                  </div>
                )}
              </section>
            )}

            {/* Timeline */}
            <section className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Timeline</h3>
              <div className="space-y-1.5">
                {[
                  { label: "Submitted", date: lead.created_at },
                  { label: "Contacted", date: lead.contacted_at },
                  { label: "Demo Scheduled", date: lead.demo_at },
                  { label: "Approved", date: lead.approved_at },
                  { label: "Rejected", date: lead.rejected_at },
                ].map(({ label, date }) => (
                  <div key={label} className={`flex items-center justify-between text-xs py-1.5 border-b border-slate-100 ${!date ? "opacity-40" : ""}`}>
                    <span className="font-semibold text-slate-600">{label}</span>
                    <span className={`font-bold ${date ? "text-slate-900" : "text-slate-400"}`}>{fmtDate(date)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Update Status */}
            <section className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Update Pipeline Status</h3>
              <Select value={newStatus} onValueChange={v => setNewStatus(v as LeadStatus)}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm">
                  <SelectValue placeholder="Move to status..." />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_ORDER.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Internal Notes</Label>
                <Textarea
                  placeholder="Add notes about this lead..."
                  defaultValue={lead.internal_notes || ""}
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm resize-none h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Assigned To</Label>
                <Input
                  placeholder="Sales rep name..."
                  defaultValue={lead.assigned_to || ""}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="rounded-xl border-slate-200 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => newStatus && statusMutation.mutate(newStatus as LeadStatus)}
                  disabled={!newStatus || statusMutation.isPending}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm h-9"
                >
                  {statusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Status"}
                </Button>
                <Button
                  onClick={() => notesMutation.mutate()}
                  disabled={notesMutation.isPending}
                  variant="outline"
                  className="flex-1 rounded-xl border-slate-200 font-bold text-sm h-9"
                >
                  {notesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Notes"}
                </Button>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeadsPipelinePage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ["owner-leads-stats"],
    queryFn: async () => (await api.get("/leads/stats")).data,
    staleTime: 30_000,
  })

  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ["owner-leads", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "50" })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      return (await api.get(`/leads/?${params}`)).data
    },
    staleTime: 30_000,
  })

  const leads: Lead[] = leadsData?.items ?? []

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Leads Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage inbound demo requests and track companies through the acquisition pipeline
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ["owner-leads-stats"] }) }}
          className="rounded-xl border-slate-200 text-xs font-bold w-fit hover:bg-emerald-500/10 hover:text-emerald-600"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {PIPELINE_ORDER.map(status => {
          const cfg = STATUS_CONFIG[status]
          const count = stats?.pipeline?.[status] ?? 0
          const isActive = statusFilter === status
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? "all" : status)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? `${cfg.bg} ${cfg.border} shadow-sm`
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-2xl font-black text-slate-900">{count}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isActive ? cfg.color : "text-slate-400"}`}>
                {cfg.label}
              </p>
            </button>
          )
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by company, contact, email, or lead ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 text-sm h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="rounded-xl border-slate-200 text-sm h-10 w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PIPELINE_ORDER.map(s => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-slate-200 mb-3" />
            <p className="text-slate-500 font-semibold">No leads yet</p>
            <p className="text-slate-400 text-sm mt-1">
              {statusFilter !== "all" ? `No ${STATUS_CONFIG[statusFilter].label} leads.` : "Demo requests will appear here when companies submit the form."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Company</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-2">Industry</div>
              <div className="col-span-1">Users</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Date</div>
            </div>
            {leads.map((lead, i) => (
              <motion.button
                key={lead.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedLead(lead)}
                className="w-full grid grid-cols-12 gap-3 px-5 py-4 hover:bg-slate-50 text-left transition-colors items-center group"
              >
                <div className="col-span-1">
                  <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {lead.lead_id.split("-").slice(-1)[0]}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="font-bold text-sm text-slate-900 truncate">{lead.company_name}</p>
                  <p className="text-xs text-slate-400 truncate">{lead.business_email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-700 font-semibold truncate">{lead.contact_person}</p>
                  <p className="text-xs text-slate-400">{lead.phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-600 truncate">{lead.industry || "—"}</p>
                  <p className="text-xs text-slate-400">{lead.company_size || "—"}</p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-bold text-slate-700">{lead.expected_users ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <StatusBadge status={lead.status} />
                </div>
                <div className="col-span-1 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{fmtDate(lead.created_at)}</p>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onRefresh={() => {
          refetch()
          qc.invalidateQueries({ queryKey: ["owner-leads-stats"] })
          setSelectedLead(null)
        }}
      />
    </div>
  )
}
