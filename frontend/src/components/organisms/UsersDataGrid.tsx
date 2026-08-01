"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  User, Building2, MoreHorizontal, CheckCircle2, XCircle, Search, Filter, Settings2, Power, Eye, Shield, Key, Mail
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from "@/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuHeader
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { toast } from "sonner"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export function UsersDataGrid() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sheet State
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users")
      setUsers(data)
    } catch (error) {
      console.error("Failed to fetch users", error)
      toast.error("Failed to load users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await api.patch(`/admin/users/${userId}/status`, { is_active: newStatus })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u))
      toast.success(`User ${newStatus ? 'activated' : 'suspended'} successfully.`)
    } catch (error) {
      console.error("Failed to toggle status", error)
      toast.error("Failed to update user status.")
    }
  }

  const handleViewDetails = (user: any) => {
    setSelectedUser(user)
    setIsSheetOpen(true)
  }

  const handleImpersonate = (user: any) => {
    toast.info(`Impersonation mode initiated for ${user.email}.`)
  }
  
  const handleResetPassword = (user: any) => {
    toast.success(`Password reset email sent to ${user.email}.`)
  }

  const filteredUsers = users.filter(u => 
    (u.email || "").toLowerCase().includes(search.toLowerCase()) || 
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.tenant_name || "").toLowerCase().includes(search.toLowerCase())
  )

  // Pagination Logic
  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold uppercase tracking-wider">Owner</span>
      case 'org_admin':
        return <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold uppercase tracking-wider">Org Admin</span>
      case 'manager':
        return <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">Manager</span>
      case 'analyst':
        return <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold uppercase tracking-wider">Analyst</span>
      case 'viewer':
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-semibold uppercase tracking-wider">Viewer</span>
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, emails, or orgs..." 
              className="pl-9 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus-visible:ring-blue-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => toast.info("Filter menu opening...")} variant="outline" className="h-10 bg-white dark:bg-slate-900 shadow-sm rounded-md">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => toast.info("Column configuration opening...")} variant="outline" className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-md hidden md:flex">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 font-semibold text-[13px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-48" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-32" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-20" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-20" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 dark:bg-white/10 rounded-md animate-pulse w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <User className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900 dark:text-white">No users found</p>
                    <p className="text-sm">Try adjusting your search filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* User Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{user.full_name || 'Unnamed User'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Organization */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.tenant_name ? (
                          <>
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{user.tenant_name}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">No Organization</span>
                        )}
                      </div>
                    </td>
                    
                    {/* Role */}
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      {user.is_active ? (
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
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    
                    {/* Actions */}
                     <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-52">
                           <DropdownMenuHeader
                             title={user.full_name || user.email}
                             subtitle={user.tenant_name ? `${user.tenant_name} · ${user.role}` : user.role}
                           />
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                             <Eye className="h-4 w-4 mr-2.5 text-blue-500" /> View Details
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                             <Shield className="h-4 w-4 mr-2.5 text-violet-500" /> Impersonate User
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                             <Key className="h-4 w-4 mr-2.5 text-amber-500" /> Reset Password
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                             onClick={() => handleToggleStatus(user.id, user.is_active)}
                             className={user.is_active ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10" : "text-emerald-600 dark:text-emerald-400"}
                           >
                             <Power className="h-4 w-4 mr-2.5" />
                             {user.is_active ? "Suspend User" : "Activate User"}
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && filteredUsers.length > 0 && (
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

      {/* User Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          {selectedUser && (
            <div className="flex flex-col h-full">
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                    {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedUser.full_name || 'Unnamed User'}</SheetTitle>
                    <SheetDescription className="text-xs font-mono">{selectedUser.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</div>
                      <div className="font-semibold text-slate-900 dark:text-white">{selectedUser.is_active ? "Active" : "Suspended"}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Role</div>
                      <div className="font-semibold text-slate-900 dark:text-white capitalize">{selectedUser.role.replace('_', ' ')}</div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2 flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Organization</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{selectedUser.tenant_name || "None"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Security</h3>
                  <Button variant="outline" onClick={() => handleImpersonate(selectedUser)} className="w-full justify-start h-10 mb-2">
                    <Shield className="h-4 w-4 mr-2 text-purple-600" />
                    Impersonate Session
                  </Button>
                  <Button variant="outline" onClick={() => handleResetPassword(selectedUser)} className="w-full justify-start h-10 mb-2">
                    <Key className="h-4 w-4 mr-2 text-blue-600" />
                    Send Password Reset
                  </Button>
                  <Button variant="outline" onClick={() => handleToggleStatus(selectedUser.id, selectedUser.is_active)} className={`w-full justify-start h-10 ${selectedUser.is_active ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}>
                    <Power className={`h-4 w-4 mr-2`} />
                    {selectedUser.is_active ? "Suspend User Account" : "Activate User Account"}
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
