"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Layers, Plus, RefreshCw, Server, HardDrive, Cpu, Database, ShieldCheck, ChevronDown } from "lucide-react"
import { ResourceRequestItem, billingService } from "@/lib/billing.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ResourceRequestCenterProps {
  requests: ResourceRequestItem[]
  onRefresh: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialType?: "storage" | "database" | "ai_tokens" | "compute" | "backup" | "custom"
}

export function ResourceRequestCenter({
  requests,
  onRefresh,
  isOpen,
  onOpenChange,
  initialType = "storage"
}: ResourceRequestCenterProps) {
  const [resourceType, setResourceType] = useState<string>(initialType)
  const [requestedCapacity, setRequestedCapacity] = useState("")
  const [businessReason, setBusinessReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestedCapacity.trim() || !businessReason.trim()) {
      toast.error("Please fill in the requested capacity and business justification.")
      return
    }

    try {
      setIsSubmitting(true)
      await billingService.createResourceRequest({
        resource_type: resourceType as any,
        requested_capacity: requestedCapacity.trim(),
        business_reason: businessReason.trim()
      })
      toast.success("Resource expansion request submitted! Our engineering team will review your allocation.")
      setRequestedCapacity("")
      setBusinessReason("")
      onOpenChange(false)
      onRefresh()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to submit resource request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">Completed</Badge>
      case "approved":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">Approved</Badge>
      case "provisioning":
        return <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold animate-pulse">Provisioning</Badge>
      case "under_review":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">Under Review</Badge>
      case "rejected":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">Declined</Badge>
      default:
        return <Badge variant="secondary" className="font-bold">Submitted</Badge>
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "database": return <Database className="h-4 w-4 text-emerald-500" />
      case "storage": return <HardDrive className="h-4 w-4 text-teal-500" />
      case "ai_tokens": return <Cpu className="h-4 w-4 text-violet-500" />
      case "compute": return <Server className="h-4 w-4 text-amber-500" />
      case "backup": return <ShieldCheck className="h-4 w-4 text-blue-500" />
      default: return <Layers className="h-4 w-4 text-slate-500" />
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-3xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
                  Resource & Infrastructure Capacity Requests
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Request additional storage, database capacity, AI tokens, or specialized compute for your tenant.
                </CardDescription>
              </div>
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Request Expansion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px] rounded-3xl p-6 border-slate-200 dark:border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">Request Infrastructure Expansion</DialogTitle>
                  <DialogDescription className="text-xs font-medium text-slate-500">
                    Submit a request to scale your dedicated single-tenant resources. Our infrastructure team provisions changes within SLA windows.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="resource-type" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Resource Category</Label>
                    <div className="relative">
                      <select
                        id="resource-type"
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white transition-colors outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      >
                        <option value="storage" className="dark:bg-slate-900">Storage (+500 GB / +1 TB Cloud Storage)</option>
                        <option value="database" className="dark:bg-slate-900">Database (IOPS & Dedicated Storage Tier)</option>
                        <option value="ai_tokens" className="dark:bg-slate-900">AI Tokens (+5M / +10M Monthly Tokens)</option>
                        <option value="compute" className="dark:bg-slate-900">Dedicated Compute / Worker Threads</option>
                        <option value="backup" className="dark:bg-slate-900">Custom Backup & Extended Retention</option>
                        <option value="custom" className="dark:bg-slate-900">Custom Architecture Specification</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="requested-capacity" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Requested Allocation / Capacity</Label>
                    <Input
                      id="requested-capacity"
                      placeholder="e.g. +1,000 GB Storage or Tier-2 High-IOPS Database"
                      value={requestedCapacity}
                      onChange={(e) => setRequestedCapacity(e.target.value)}
                      className="rounded-2xl bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="business-reason" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Business Justification</Label>
                    <Textarea
                      id="business-reason"
                      placeholder="Briefly describe the operational necessity for this expansion (e.g. onboarding 5 new regional data feeds)..."
                      value={businessReason}
                      onChange={(e) => setBusinessReason(e.target.value)}
                      className="rounded-2xl bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10 min-h-[90px] font-medium"
                      required
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="rounded-2xl font-bold border-slate-200 dark:border-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold rounded-2xl shadow-md"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Submit Request
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {requests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-50/50 dark:bg-white/5 border-2 border-dashed border-slate-200/80 dark:border-white/10">
              <Layers className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">No active capacity requests</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                Need more database IOPS, storage volume, or higher monthly AI quotas? Click &quot;Request Expansion&quot; to scale seamlessly.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                  <tr className="text-slate-700 dark:text-slate-300 uppercase font-extrabold tracking-wider">
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Requested Capacity</th>
                    <th className="py-3 px-4">Business Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold capitalize text-slate-800 dark:text-slate-200">
                          {getResourceIcon(r.resource_type)}
                          {r.resource_type.replace("_", " ")}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 dark:text-white">
                        {r.requested_capacity}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={r.business_reason}>
                        {r.business_reason}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
