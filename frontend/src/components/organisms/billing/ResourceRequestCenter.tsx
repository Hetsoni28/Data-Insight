"use client"

import React, { useState } from "react"
import { Layers, Plus, CheckCircle2, Clock, AlertCircle, RefreshCw, Server, HardDrive, Cpu, Database, ShieldCheck, ChevronDown } from "lucide-react"
import { ResourceRequestItem, CreateResourceRequestPayload, billingService } from "@/lib/billing.service"
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
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Completed</Badge>
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Approved</Badge>
      case "provisioning":
        return <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse">Provisioning</Badge>
      case "under_review":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Under Review</Badge>
      case "rejected":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">Declined</Badge>
      default:
        return <Badge variant="secondary">Submitted</Badge>
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
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Resource & Infrastructure Capacity Requests
              </CardTitle>
              <CardDescription className="text-xs">
                Request additional storage, database capacity, AI tokens, or specialized compute for your tenant.
              </CardDescription>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl">
                <Plus className="h-4 w-4 mr-1.5" />
                Request Expansion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Request Infrastructure Expansion</DialogTitle>
                <DialogDescription className="text-xs">
                  Submit a request to scale your dedicated single-tenant resources. Our infrastructure team provisions changes within SLA windows.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="resource-type" className="text-xs font-semibold">Resource Category</Label>
                  <div className="relative">
                    <select
                      id="resource-type"
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <option value="storage" className="dark:bg-white/5">Storage (+500 GB / +1 TB Cloud Storage)</option>
                      <option value="database" className="dark:bg-white/5">Database (IOPS & Dedicated Storage Tier)</option>
                      <option value="ai_tokens" className="dark:bg-white/5">AI Tokens (+5M / +10M Monthly Tokens)</option>
                      <option value="compute" className="dark:bg-white/5">Dedicated Compute / Worker Threads</option>
                      <option value="backup" className="dark:bg-white/5">Custom Backup & Extended Retention</option>
                      <option value="custom" className="dark:bg-white/5">Custom Architecture Specification</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="requested-capacity" className="text-xs font-semibold">Requested Allocation / Capacity</Label>
                  <Input
                    id="requested-capacity"
                    placeholder="e.g. +1,000 GB Storage or Tier-2 High-IOPS Database"
                    value={requestedCapacity}
                    onChange={(e) => setRequestedCapacity(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="business-reason" className="text-xs font-semibold">Business Justification</Label>
                  <Textarea
                    id="business-reason"
                    placeholder="Briefly describe the operational necessity for this expansion (e.g. onboarding 5 new regional data feeds)..."
                    value={businessReason}
                    onChange={(e) => setBusinessReason(e.target.value)}
                    className="rounded-xl min-h-[90px]"
                    required
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl"
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

      <CardContent>
        {requests.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-white/5/30 border border-dashed border-slate-200 dark:border-slate-800">
            <Layers className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active capacity requests</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Need more database IOPS, storage volume, or higher monthly AI quotas? Click &quot;Request Expansion&quot; to scale seamlessly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Requested Capacity</th>
                  <th className="pb-3 pr-4">Business Reason</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2 font-medium capitalize text-slate-800 dark:text-slate-200">
                        {getResourceIcon(r.resource_type)}
                        {r.resource_type.replace("_", " ")}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {r.requested_capacity}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={r.business_reason}>
                      {r.business_reason}
                    </td>
                    <td className="py-3 pr-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3 text-right text-slate-500 whitespace-nowrap">
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
  )
}
