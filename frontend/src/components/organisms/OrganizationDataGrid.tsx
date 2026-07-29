"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Building2, Users, Database, MoreHorizontal, CheckCircle2, XCircle, Search, Filter, Shield, Settings2, Trash2, Power, Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet"
import api from "@/lib/api"
import { toast } from "sonner"

export function OrganizationDataGrid() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Sheet State
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const { data } = await api.get("/admin/tenants")
      setTenants(data)
    } catch (error) {
      console.error("Failed to fetch tenants", error)
      toast.error("Failed to load organizations.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await api.patch(`/admin/tenants/${tenantId}/status`, { is_active: newStatus })
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, is_active: newStatus } : t))
      toast.success(`Organization ${newStatus ? 'activated' : 'suspended'} successfully.`)
    } catch (error) {
      console.error("Failed to toggle status", error)
      toast.error("Failed to update organization status.")
    }
  }

  const handleViewDetails = (tenant: any) => {
    setSelectedTenant(tenant)
    setIsSheetOpen(true)
  }

  const handleImpersonate = (tenant: any) => {
    // We would need to select a specific user to impersonate, so for now we show a toast.
    toast.info(`Impersonation mode initiated for ${tenant.name}.`)
  }

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold uppercase tracking-wider">Enterprise</span>
      case 'professional':
        return <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">Professional</span>
      case 'starter':
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold uppercase tracking-wider">Starter</span>
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..." 
              className="pl-9 h-10 bg-white border-slate-200 rounded-md focus-visible:ring-emerald-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => toast.info("Filter menu opening...")} variant="outline" className="h-10 bg-white shadow-sm rounded-md">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => toast.info("Column configuration opening...")} variant="outline" className="h-10 bg-white shadow-sm rounded-md hidden md:flex">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-md animate-pulse w-48" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-md animate-pulse w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-md animate-pulse w-32" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-md animate-pulse w-20" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-md animate-pulse w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-md animate-pulse w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">No organizations found</p>
                    <p className="text-sm">Try adjusting your search filters.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={tenant.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Organization Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{tenant.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Plan */}
                    <td className="px-6 py-4">
                      {getPlanBadge(tenant.plan)}
                    </td>
                    
                    {/* Usage Summary */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-600" title="Active Users">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{tenant.users_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600" title="Datasets">
                          <Database className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{tenant.datasets_count || 0}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      {tenant.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-600 text-sm font-medium">
                          <XCircle className="h-4 w-4" /> Suspended
                        </span>
                      )}
                    </td>
                    
                    {/* Created Date */}
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(tenant.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={() => handleViewDetails(tenant)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 rounded-md" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleImpersonate(tenant)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 rounded-md" title="Impersonate User">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleToggleStatus(tenant.id, tenant.is_active)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-md" title={tenant.is_active ? "Suspend Organization" : "Activate Organization"}>
                          <Power className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && filteredTenants.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
            <div>Showing <span className="font-semibold text-slate-900">{filteredTenants.length}</span> organizations</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-md bg-white" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-md bg-white">Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Tenant Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-md border-l border-slate-200">
          {selectedTenant && (
            <div className="flex flex-col h-full">
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedTenant.name}</SheetTitle>
                    <SheetDescription className="text-xs font-mono">{selectedTenant.id}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Status</div>
                      <div className="font-semibold text-slate-900">{selectedTenant.is_active ? "Active" : "Suspended"}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Plan</div>
                      <div className="font-semibold text-slate-900 capitalize">{selectedTenant.plan}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Active Users</div>
                      <div className="font-semibold text-slate-900">{selectedTenant.users_count || 0}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Datasets</div>
                      <div className="font-semibold text-slate-900">{selectedTenant.datasets_count || 0}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Security</h3>
                  <Button variant="outline" className="w-full justify-start h-10 mb-2">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    Impersonate Administrator
                  </Button>
                  <Button variant="outline" onClick={() => handleToggleStatus(selectedTenant.id, selectedTenant.is_active)} className={`w-full justify-start h-10 ${selectedTenant.is_active ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}>
                    <Power className={`h-4 w-4 mr-2`} />
                    {selectedTenant.is_active ? "Suspend Organization" : "Activate Organization"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
