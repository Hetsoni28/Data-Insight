"use client"
import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Building2, Users, Database, Search, Filter, Shield, Settings2, Power, Eye, Activity, HardDrive
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { toast } from "sonner"
import { PaginationControls } from "@/components/molecules/PaginationControls"
import { OrganizationDetailsDrawer } from "./OrganizationDetailsDrawer"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function OrganizationDataGrid() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Drawer State
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const queryClient = useQueryClient()

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ tenantId, isActive }: { tenantId: string, isActive: boolean }) => {
      const res = await api.patch(`/admin/tenants/${tenantId}/status`, { is_active: isActive })
      return res.data
    },
    onSuccess: (data, variables) => {
      toast.success(`Organization ${variables.isActive ? 'activated' : 'suspended'} successfully.`)
      // Optimistically update local state so we don't have to refetch immediately, or just invalidate
      setTenants(prev => (Array.isArray(prev) ? prev : []).map(t => t.id === variables.tenantId ? { ...t, is_active: variables.isActive } : t))
      queryClient.invalidateQueries({ queryKey: ['admin-global-kpis'] })
    },
    onError: () => toast.error("Failed to update organization status.")
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const { data } = await api.get("/admin/tenants")
      const list = Array.isArray(data) ? data : (data?.items || data?.data || data?.tenants || [])
      setTenants(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error("Failed to fetch tenants", error)
      toast.error("Failed to load organizations.")
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = (tenantId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleStatusMutation.mutate({ tenantId, isActive: !currentStatus })
  }

  const handleViewDetails = (tenant: any) => {
    setSelectedTenant(tenant)
    setIsDrawerOpen(true)
  }

  const handleImpersonate = (tenant: any, e: React.MouseEvent) => {
    e.stopPropagation()
    toast.info(`Impersonation mode initiated for ${tenant.name}.`)
  }

  const filteredTenants = useMemo(() => {
    const list = Array.isArray(tenants) ? tenants : []
    return list.filter(t => 
      (t?.name || "").toLowerCase().includes(search.toLowerCase()) || 
      (t?.slug && t.slug.toLowerCase().includes(search.toLowerCase())) ||
      (t?.industry && t.industry.toLowerCase().includes(search.toLowerCase()))
    )
  }, [tenants, search])

  // Pagination Logic
  const totalItems = filteredTenants.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTenants = useMemo(() =>
    filteredTenants.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredTenants, currentPage, pageSize]
  )

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <>
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/5">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..." 
              className="pl-9 h-10 bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-md focus-visible:ring-emerald-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => toast.info("Filter menu opening...")} variant="outline" className="h-10 shadow-sm rounded-md bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            <Button onClick={() => toast.info("Column configuration opening...")} variant="outline" className="h-10 shadow-sm rounded-md hidden md:flex bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Plan & MRR</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Health</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Usage & Storage</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Security</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-48" /></td>
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-24" /></td>
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-32" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-16" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Building2 className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-base font-medium text-slate-900 dark:text-white">No organizations found</p>
                    <p className="text-sm">Try adjusting your search filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedTenants.map((tenant, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={tenant.id} 
                    onClick={() => handleViewDetails(tenant)}
                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    {/* Organization Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200/60 dark:border-white/10 shadow-sm">
                          <span className="font-bold text-lg">{tenant.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{tenant.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{tenant.industry}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Plan & MRR */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">{tenant.plan}</span>
                        <span className="text-xs text-slate-500">${tenant.mrr}/mo</span>
                      </div>
                    </td>
                    
                    {/* Health Score */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          tenant.health_score === 'Excellent' ? 'bg-emerald-500' :
                          tenant.health_score === 'Good' ? 'bg-emerald-500' :
                          tenant.health_score === 'Needs Attention' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          tenant.health_score === 'Excellent' ? 'text-emerald-700 dark:text-emerald-400' :
                          tenant.health_score === 'Good' ? 'text-emerald-700 dark:text-emerald-400' :
                          tenant.health_score === 'Needs Attention' ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}>{tenant.health_score}</span>
                      </div>
                    </td>
                    
                    {/* Usage & Storage */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1" title="Active Users"><Users className="w-3 h-3" /> {tenant.active_users}/{tenant.users_count}</span>
                          <span className="flex items-center gap-1" title="Storage Used"><HardDrive className="w-3 h-3" /> {tenant.storage_used} GB</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400" title="AI Requests">
                          <Activity className="w-3 h-3" /> {(tenant.ai_requests/1000).toFixed(1)}k requests
                        </div>
                      </div>
                    </td>
                    
                    {/* Security */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        {tenant.security_score}/100
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button onClick={(e) => handleImpersonate(tenant, e)} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md" title="Impersonate User">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button onClick={(e) => handleToggleStatus(tenant.id, tenant.is_active, e)} variant="ghost" size="icon" className={`h-8 w-8 text-slate-400 rounded-md ${tenant.is_active ? "hover:text-rose-600" : "hover:text-emerald-600"}`} title={tenant.is_active ? "Suspend Organization" : "Activate Organization"}>
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
          <PaginationControls 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      <OrganizationDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        tenant={selectedTenant} 
      />
    </>
  )
}
