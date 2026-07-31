"use client"

import { useState } from "react"
import { 
  Search, Filter, ChevronDown, MoreHorizontal, ArrowUpDown, 
  CheckCircle2, XCircle, AlertCircle, Eye, Edit, ShieldAlert,
  Download
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SubscriptionDetailsDrawer } from "./SubscriptionDetailsDrawer"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"

interface DataGridProps {
  data: any[]
  isLoading: boolean
}

export function SubscriptionDataGrid({ data, isLoading }: DataGridProps) {
  const [search, setSearch] = useState("")
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  
  const queryClient = useQueryClient()

  const toggleStatusMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await api.post(`/owner/subscriptions/${tenantId}/toggle-status`)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner-subscriptions-list'] })
      queryClient.invalidateQueries({ queryKey: ['owner-subscriptions-kpis'] })
      toast.success(`Organization ${data.is_active ? 'reactivated' : 'suspended'} successfully.`)
    },
    onError: () => toast.error("Failed to update organization status.")
  })

  if (isLoading) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="p-4 space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    )
  }

  const filteredData = data?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.plan.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search organizations or plans..." 
            className="pl-9 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hidden sm:flex">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button variant="outline" className="h-10 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hidden sm:flex" onClick={() => toast.success("Exporting visible rows...")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium"><div className="flex items-center cursor-pointer hover:text-slate-900 dark:hover:text-slate-300">Organization <ArrowUpDown className="ml-1 w-3 h-3" /></div></th>
              <th className="px-6 py-4 font-medium">Plan</th>
              <th className="px-6 py-4 font-medium">MRR</th>
              <th className="px-6 py-4 font-medium">Cycle</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No subscriptions found matching your search.
                </td>
              </tr>
            ) : filteredData.map((tenant: any) => (
              <tr 
                key={tenant.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedTenant(tenant)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{tenant.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{tenant.id.split('-')[0]}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={`
                    ${tenant.plan.toLowerCase() === 'enterprise' ? 'border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-900 dark:text-purple-400 dark:bg-purple-900/20' : ''}
                    ${tenant.plan.toLowerCase() === 'professional' ? 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:bg-blue-900/20' : ''}
                  `}>
                    {tenant.plan.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                  ${tenant.mrr.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">
                  {tenant.billing_cycle}
                </td>
                <td className="px-6 py-4">
                  {tenant.status === 'Active' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                      <AlertCircle className="w-4 h-4" /> Suspended
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTenant(tenant); }}>
                        <Eye className="mr-2 h-4 w-4 text-slate-500" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Edit Plan feature coming soon."); }}>
                        <Edit className="mr-2 h-4 w-4 text-slate-500" /> Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {tenant.status === 'Active' ? (
                        <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(tenant.id); }}>
                          <ShieldAlert className="mr-2 h-4 w-4" /> Suspend Account
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600" onClick={(e) => { e.stopPropagation(); toggleStatusMutation.mutate(tenant.id); }}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Drawer */}
      <SubscriptionDetailsDrawer 
        isOpen={!!selectedTenant} 
        onClose={() => { setSelectedTenant(null); toggleStatusMutation.reset(); }} 
        tenant={selectedTenant}
      />
    </div>
  )
}
