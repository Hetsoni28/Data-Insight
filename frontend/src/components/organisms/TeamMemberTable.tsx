"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { MoreVertical, Search, Filter, Mail, ShieldAlert, MonitorPlay, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TeamMemberTable({ members, departments }: { members: any[], departments: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [deptFilter, setDeptFilter] = useState("All")

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "All" || (m.role || "").toLowerCase() === roleFilter.toLowerCase();
    
    // Some mock logic since team members usually have is_active or status
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Active" ? (m.status === 'active' || m.is_active !== false) : (m.status === 'suspended' || m.is_active === false));
      
    const matchesDept = deptFilter === "All" || (m.department || "Unassigned").toLowerCase() === deptFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  })

  return (
    <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Table Toolbar */}
      <div className="p-5 border-b border-slate-200/80 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/30 dark:bg-slate-900/30">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email, or employee ID..." 
            className="pl-10 h-10 bg-white dark:bg-black/20 border-slate-200/80 dark:border-white/10 rounded-xl text-sm focus-visible:ring-emerald-500/50 shadow-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            variant={isFilterOpen ? "default" : "outline"} 
            className={`gap-2 rounded-xl border-slate-200/80 dark:border-white/10 dark:bg-white/5 font-semibold text-xs h-10 flex-1 md:flex-none shadow-sm ${!isFilterOpen ? 'text-slate-600 dark:text-slate-300' : ''}`}
          >
            <Filter className="w-4 h-4 text-slate-400" />
            Filters
          </Button>
          <Button onClick={() => toast.info("Bulk invite mode enabled. Use the Invitation Center for mass invites.")} variant="outline" className="gap-2 rounded-xl border-slate-200/80 dark:border-white/10 dark:bg-white/5 font-semibold text-xs h-10 flex-1 md:flex-none">
            <Mail className="w-4 h-4 text-emerald-500" />
            Bulk Invite
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isFilterOpen && (
        <div className="p-4 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex flex-wrap gap-4 text-sm">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Role</label>
                <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 dark:text-white rounded-md px-3 py-1.5 h-9 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm min-w-[140px]"
                >
                    <option value="All">All Roles</option>
                    <option value="owner">Owner</option>
                    <option value="org_admin">Org Admin</option>
                    <option value="manager">Manager</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Department</label>
                <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 dark:text-white rounded-md px-3 py-1.5 h-9 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm min-w-[140px]"
                >
                    <option value="All">All Departments</option>
                    {departments.map((dept: any, i) => (
                      <option key={i} value={dept.name || dept}>{dept.name || dept}</option>
                    ))}
                    <option value="Unassigned">Unassigned</option>
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</label>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 dark:text-white rounded-md px-3 py-1.5 h-9 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm min-w-[140px]"
                >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                </select>
            </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5 tracking-wider">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Activity</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No team members found matching your search.
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredMembers.map((member) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={member.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                          {member.full_name?.charAt(0) || member.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {member.full_name || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                            {member.email}
                            {member.employee_id && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                ID: {member.employee_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-2xs">
                        {member.role === 'org_admin' ? (
                          <><ShieldAlert className="w-3 h-3 mr-1 text-rose-500" /> Admin</>
                        ) : (
                          <span className="capitalize">{member.role.replace('_', ' ')}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">
                      {member.department || <span className="italic text-slate-400 font-normal">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      {member.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-xs">
                        {member.active_sessions > 0 ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            <Activity className="w-3.5 h-3.5" />
                            {member.active_sessions} Sessions
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                            <MonitorPlay className="w-3.5 h-3.5" />
                            Offline
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
