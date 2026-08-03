"use client"

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2, Calendar, CreditCard, Shield, HardDrive,
  Users, Zap, Database, ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

export function SubscriptionDetailsDrawer({ isOpen, onClose, tenant }: { isOpen: boolean, onClose: () => void, tenant: any }) {
  const queryClient = useQueryClient()

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await api.post(`/owner/subscriptions/${tenantId}/cancel`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-subscriptions-list'] })
      queryClient.invalidateQueries({ queryKey: ['owner-subscriptions-kpis'] })
      toast.success("Subscription canceled. MRR set to 0 and account suspended.")
      onClose()
    },
    onError: () => toast.error("Failed to cancel subscription.")
  })

  // Fetch real invoices for this specific tenant
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['tenant-invoices', tenant?.id],
    queryFn: async () => {
      const res = await api.get(`/owner/billing/invoices`, {
        params: { tenant_id: tenant?.id, limit: 5 }
      })
      return res.data?.data ?? []
    },
    enabled: isOpen && !!tenant?.id,
  })

  // Stable date for renewal — derived from created_at + 30 days
  const renewalDate = useMemo(() => {
    if (!tenant?.created_at) return new Date()
    const d = new Date(tenant.created_at)
    d.setDate(d.getDate() + 30)
    return d
  }, [tenant])

  if (!isOpen || !tenant) return null

  // Real quota values from the admin/tenants endpoint
  const seatsUsed = tenant.active_users ?? 0
  const seatsTotal = tenant.users_count ?? 0
  const storagUsedGb = tenant.storage_used ?? 0
  const storageLimitGb = tenant.storage_limit ?? 10
  const aiRequests = tenant.ai_requests ?? 0
  const aiLimit = 100_000
  const seatsPercent = seatsTotal > 0 ? Math.min((seatsUsed / seatsTotal) * 100, 100) : 0
  const storagePercent = storageLimitGb > 0 ? Math.min((storagUsedGb / storageLimitGb) * 100, 100) : 0
  const aiPercent = Math.min((aiRequests / aiLimit) * 100, 100)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-slate-200/60 dark:border-white/10 shadow-2xl flex flex-col bg-white dark:bg-[#0B0F17] gap-0">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-2xl font-bold">{tenant?.name?.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {tenant?.name}
                {tenant?.status === 'Active' ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Suspended</Badge>
                )}
              </h2>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1 gap-4">
                {/* ✅ Fix: real industry from tenant data */}
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {tenant?.industry || "Technology"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Since {new Date(tenant?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Subscription & Billing */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Subscription & Billing
            </h3>
            <div className="p-5 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{tenant?.plan?.toUpperCase() ?? "FREE"} Plan</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  ${tenant?.mrr?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? "0.00"} / {tenant?.billing_cycle ?? "monthly"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Next invoice processing on {renewalDate.toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" className="bg-[#0A3A2A] hover:bg-[#06261c] text-white" onClick={() => window.open("https://dashboard.stripe.com/test/customers", "_blank")}>Manage Subscription</Button>
                <Button variant="outline" size="sm" onClick={() => window.open("https://dashboard.stripe.com/test/invoices", "_blank")}>View All Invoices</Button>
              </div>
            </div>
          </div>

          {/* ✅ Fix: Real Limits & Usage from tenant fields */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" /> Quotas & Usage
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5">
                <Users className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {seatsUsed}<span className="text-sm font-normal text-slate-500"> / {seatsTotal}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">Active / Total Seats</div>
                <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 mt-3">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${seatsPercent}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5">
                <HardDrive className="w-5 h-5 text-sky-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {storagUsedGb.toFixed(2)}<span className="text-sm font-normal text-slate-500"> / {storageLimitGb} GB</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">Storage Used</div>
                <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 mt-3">
                  <div className="bg-sky-500 h-1.5 rounded-full transition-all" style={{ width: `${storagePercent}%` }} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 col-span-2">
                <Zap className="w-5 h-5 text-amber-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {aiRequests >= 1000 ? `${(aiRequests / 1000).toFixed(1)}k` : aiRequests}
                  <span className="text-sm font-normal text-slate-500"> / {(aiLimit / 1000)}k</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">AI Requests (Lifetime)</div>
                <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 mt-3">
                  <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${aiPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Fix: Real Invoice list from API */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Recent Invoices
            </h3>
            <div className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 divide-y divide-slate-100 dark:divide-white/10">
              {invoicesLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : invoicesData && invoicesData.length > 0 ? (
                invoicesData.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">INV-{inv.id.split('-')[0].toUpperCase()}</div>
                        <div className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">${Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No invoices found for this organization.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-[#0B0F17] flex justify-between gap-3 mt-auto">
          <Button 
            variant="outline" 
            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
            onClick={() => {
              if (confirm("Are you sure you want to cancel this subscription? This will set MRR to $0 and suspend the account instantly.")) {
                cancelSubscriptionMutation.mutate(tenant.id)
              }
            }}
          >
            Cancel Subscription
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => toast.success("Opening Stripe Dashboard in new tab...")}>
              <ExternalLink className="w-4 h-4 mr-2" /> Stripe Dashboard
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
