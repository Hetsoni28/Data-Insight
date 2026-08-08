"use client"
import { useState, useEffect } from "react"
import { 
  Search, MoreHorizontal, FileText, XCircle, Settings, CheckCircle2, AlertTriangle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { toast } from "sonner"

export function SubscriptionsDataGrid() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchSubs()
  }, [])

  const fetchSubs = async () => {
    try {
      const res = await api.get("/admin/subscriptions")
      setSubs(Array.isArray(res.data) ? res.data : (res.data?.data || []))
    } catch (error) {
      console.error("Failed to fetch subscriptions", error)
      toast.error("Failed to load subscriptions.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSub = async (id: string, name: string) => {
    try {
      await api.post(`/owner/subscriptions/${id}/cancel`)
      toast.success(`Subscription for ${name} has been marked for cancellation at the end of the billing cycle.`)
      setSubs(subs.map(s => s.id === id ? { ...s, status: 'suspended' } : s))
    } catch (error) {
      toast.error("Failed to cancel subscription.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
      case 'past_due':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Past Due</span>
      case 'canceled':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" /> Canceled</span>
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-semibold">{status}</span>
    }
  }

  const getPlanBadge = (plan: string) => {
    if (plan === 'Enterprise') return <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{plan}</span>
    if (plan === 'Professional') return <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{plan}</span>
    return <span className="text-amber-700 dark:text-amber-400 font-semibold">{plan}</span>
  }

  const filteredSubs = subs.filter(s => 
    s.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col justify-center items-center bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading subscriptions...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
      
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search tenant or subscription ID..." 
            className="pl-9 h-10 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {filteredSubs.length} Subscription{filteredSubs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 font-semibold">
            <tr>
              <th className="px-6 py-4">Organization (Tenant)</th>
              <th className="px-6 py-4">Subscription ID</th>
              <th className="px-6 py-4">Plan & Amount</th>
              <th className="px-6 py-4">Billing Cycle</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredSubs.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{sub.tenant_name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-slate-500 dark:text-slate-400 text-xs">{sub.id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    {getPlanBadge(sub.plan)}
                    <span className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">${sub.amount.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{sub.billing_cycle}</span>
                    <span className="text-slate-400 text-xs mt-0.5">Renews {new Date(sub.next_billing_date).toLocaleDateString()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(sub.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuHeader title={sub.tenant_name} subtitle={`${sub.plan} · ${sub.status}`} />
                      <DropdownMenuItem onClick={() => window.open("https://dashboard.stripe.com/test/customers", "_blank")}>
                        <Settings className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Change Plan</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open("https://dashboard.stripe.com/test/invoices", "_blank")}>
                        <FileText className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>View Invoices</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {sub.status !== 'canceled' && (
                        <DropdownMenuItem onClick={() => handleCancelSub(sub.id, sub.tenant_name)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Cancel Subscription</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filteredSubs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No subscriptions found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
