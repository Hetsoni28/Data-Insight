"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Search, Filter, Download, Building2, ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Lead, LeadStatus, StatusBadge, STATUS_CONFIG, PIPELINE_ORDER, LeadDetailsDrawer } from "./LeadDetailsDrawer"
import { toast } from "sonner"

interface LeadsDataGridProps {
  data: Lead[]
  isLoading: boolean
  statusFilter: LeadStatus | "all"
  search: string
  setSearch: (s: string) => void
  onRefresh: () => void
}

export function LeadsDataGrid({ data, isLoading, statusFilter, search, setSearch, onRefresh }: LeadsDataGridProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Note: Filtering is handled server-side via React Query for status/search, 
  // but we can add advanced client-side filters if we wanted to later.
  
  function fmtDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  }

  if (isLoading) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
        <div className="p-4 border-b border-slate-200/60 dark:border-white/10">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="p-4 space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by company, contact, email, or lead ID..." 
            className="pl-9 h-10 bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 dark:text-white dark:placeholder:text-slate-500 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-lg" onClick={() => toast.success("Exporting leads as CSV...")}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-16 w-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">No leads found</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 max-w-sm">
                {statusFilter !== "all" ? `No leads match the ${STATUS_CONFIG[statusFilter].label} status filter.` : "Demo requests will appear here when companies submit the form."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/80 dark:bg-white/[0.02] text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <div className="col-span-1">ID</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Requirements</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Timeline</div>
              </div>
              
              {/* Table Body */}
              {data.map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedLead(lead)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.04] text-left transition-colors items-center group cursor-pointer"
                >
                  <div className="col-span-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md tracking-widest">
                      {lead.lead_id.split("-").slice(-1)[0]}
                    </span>
                  </div>
                  <div className="col-span-3 pr-4">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{lead.company_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{lead.industry || "No industry specified"}</p>
                  </div>
                  <div className="col-span-2 pr-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold truncate">{lead.contact_person}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{lead.business_email}</p>
                  </div>
                  <div className="col-span-2 pr-4">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{lead.expected_users ? `${lead.expected_users} Users` : "—"}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{lead.expected_storage_gb ? `${lead.expected_storage_gb} GB Storage` : "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={lead.status} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{fmtDate(lead.created_at)}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">Submitted</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LeadDetailsDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onRefresh={() => {
          onRefresh()
          setSelectedLead(null)
        }}
      />
    </div>
  )
}
