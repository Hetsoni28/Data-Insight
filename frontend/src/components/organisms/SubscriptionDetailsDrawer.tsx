"use client"

import { useMemo } from "react"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, Calendar, CreditCard, Shield, HardDrive, 
  Users, Zap, Database, ExternalLink 
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

  // Compute stable dates - MUST be before any early return (Rules of Hooks)
  const now = useMemo(() => Date.now(), [])
  const renewalDate = useMemo(() => new Date(now + 864000000), [now])
  const invoiceDates = useMemo(() => [1, 2, 3].map(i => new Date(now - i * 864000000 * 3)), [now])

  if (!isOpen || !tenant) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col bg-white dark:bg-slate-900 gap-0">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-2xl font-bold">{tenant?.name?.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {tenant?.name}
                {tenant?.status === 'Active' ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Suspended</Badge>
                )}
              </h2>
              <div className="flex items-center text-sm text-slate-500 mt-1 gap-4">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> Tech / SaaS</span>
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
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{tenant?.plan?.toUpperCase() ?? "FREE"} Plan</span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  ${tenant?.mrr?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? "0.00"} / {tenant?.billing_cycle ?? "monthly"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Next invoice processing on {renewalDate.toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" className="bg-[#0A3A2A] hover:bg-[#06261c] text-white" onClick={() => window.open("https://dashboard.stripe.com/test/customers", "_blank")}>Manage Subscription</Button>
                <Button variant="outline" size="sm" onClick={() => window.open("https://dashboard.stripe.com/test/invoices", "_blank")}>View All Invoices</Button>
              </div>
            </div>
          </div>

          {/* Limits & Usage */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" /> Quotas & Usage
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <Users className="w-5 h-5 text-indigo-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">12<span className="text-sm font-normal text-slate-500"> / 50</span></div>
                <div className="text-xs text-slate-500 font-medium mt-1">Seats Used</div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
                  <div className="bg-indigo-500 h-1.5 rounded-full w-1/4" />
                </div>
              </div>
              
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <HardDrive className="w-5 h-5 text-sky-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">4.2<span className="text-sm font-normal text-slate-500"> / 10 GB</span></div>
                <div className="text-xs text-slate-500 font-medium mt-1">Storage Used</div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
                  <div className="bg-sky-500 h-1.5 rounded-full w-[42%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 col-span-2">
                <Zap className="w-5 h-5 text-amber-500 mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">45.2k<span className="text-sm font-normal text-slate-500"> / 100k</span></div>
                <div className="text-xs text-slate-500 font-medium mt-1">AI Tokens (Current Billing Cycle)</div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
                  <div className="bg-amber-500 h-1.5 rounded-full w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Recent Invoices
            </h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">INV-{1000 + i * 237}</div>
                      <div className="text-xs text-slate-500">{invoiceDates[i-1].toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">${tenant?.mrr?.toLocaleString(undefined, {minimumFractionDigits: 2}) ?? "0.00"}</div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mt-1">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between gap-3 mt-auto">
          <Button 
            variant="outline" 
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
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
