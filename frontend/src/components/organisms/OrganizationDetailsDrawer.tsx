import { X, Building2, Calendar, CreditCard, Users, Database, Shield, Zap, HardDrive, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { toast } from "sonner"

export function OrganizationDetailsDrawer({ isOpen, onClose, tenant }: { isOpen: boolean, onClose: () => void, tenant: any }) {
  const queryClient = useQueryClient()
  
  // Fetch timeline activity
  const { data: activity, isLoading } = useQuery({
    queryKey: ['admin-tenant-activity', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      const res = await api.get(`/admin/tenants/${tenant.id}/activity`)
      return res.data
    },
    enabled: !!tenant?.id && isOpen
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await api.post(`/owner/subscriptions/${tenantId}/toggle-status`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-list'] })
      queryClient.invalidateQueries({ queryKey: ['admin-global-kpis'] })
      toast.success(`Organization ${data.is_active ? 'reactivated' : 'suspended'} successfully.`)
      onClose()
    },
    onError: () => toast.error("Failed to update organization status.")
  })

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col bg-white dark:bg-slate-900 gap-0">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-2xl font-bold text-slate-400">{tenant?.name?.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {tenant?.name}
                {tenant?.is_active ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                ) : (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Suspended</Badge>
                )}
              </h2>
              <div className="flex items-center text-sm text-slate-500 mt-1 gap-4">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {tenant?.industry || "Technology"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(tenant?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/50">
              <Users className="w-5 h-5 text-indigo-500 mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{tenant?.active_users}/{tenant?.users_count}</div>
              <div className="text-xs text-slate-500 font-medium">Active Users</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/50">
              <HardDrive className="w-5 h-5 text-sky-500 mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{tenant?.storage_used}<span className="text-sm font-normal text-slate-500">GB</span></div>
              <div className="text-xs text-slate-500 font-medium">Storage Used</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/50">
              <Zap className="w-5 h-5 text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{(tenant?.ai_requests/1000).toFixed(1)}k</div>
              <div className="text-xs text-slate-500 font-medium">AI Requests</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/50">
              <Shield className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{tenant?.security_score}</div>
              <div className="text-xs text-slate-500 font-medium">Security Score</div>
            </div>
          </div>

          {/* Subscription */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Subscription & Billing
            </h3>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{tenant?.plan} Plan</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Current</Badge>
                </div>
                <p className="text-sm text-slate-500">${tenant?.mrr}/month • Renews {new Date(Date.now() + 864000000).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success("Loading invoice history...")}>View Invoices</Button>
                <Button size="sm" onClick={() => toast.success("Redirecting to Plan Management...")}>Manage Plan</Button>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> Organization Health
            </h3>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Health Score</span>
                <span className={`text-sm font-bold ${
                  tenant?.health_score === 'Excellent' ? 'text-emerald-600' :
                  tenant?.health_score === 'Good' ? 'text-blue-600' :
                  tenant?.health_score === 'Needs Attention' ? 'text-amber-600' : 'text-rose-600'
                }`}>{tenant?.health_score}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className={`h-2 rounded-full ${
                  tenant?.health_score === 'Excellent' ? 'bg-emerald-500 w-full' :
                  tenant?.health_score === 'Good' ? 'bg-blue-500 w-3/4' :
                  tenant?.health_score === 'Needs Attention' ? 'bg-amber-500 w-1/2' : 'bg-rose-500 w-1/4'
                }`} />
              </div>
              <p className="text-xs text-slate-500 mt-3">Calculated based on active users, data volume, and AI adoption.</p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              ) : activity?.length ? (
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6">
                  {activity.map((item: any, i: number) => (
                    <div key={item.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full -left-[7.5px] top-1.5" />
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{item.type}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.description} by <span className="font-medium text-slate-700 dark:text-slate-300">{item.actor}</span></div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 text-center py-4">No recent activity found.</div>
              )}
            </div>
          </div>

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-between gap-3 mt-auto">
          {tenant?.is_active ? (
            <Button 
              variant="outline" 
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => toggleStatusMutation.mutate(tenant.id)}
            >
              Suspend
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => toggleStatusMutation.mutate(tenant.id)}
            >
              Reactivate
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => toast.success("Impersonating Platform Admin...")}>Impersonate</Button>
            <Button className="bg-[#0A3A2A] hover:bg-[#06261c] text-white" onClick={() => toast.success("Edit details modal opening...")}>Edit Details</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
