"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Shield, Clock, Search, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { getPendingUsers, approveUser, rejectUser } from "@/lib/users.service"
import type { User } from "@/types"

export default function UsersPage() {
  const { data: user } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await getPendingUsers()
      setPendingUsers(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch pending users")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveUser(id)
      toast.success("User approved successfully")
      setPendingUsers(prev => prev.filter(u => u.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve user")
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this access request?")) return
    try {
      await rejectUser(id)
      toast.success("User request rejected")
      setPendingUsers(prev => prev.filter(u => u.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject user")
    }
  }

  if (user?.role !== "owner") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-slate-500">
        <Shield className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Access Denied</h2>
        <p>Only the Platform Owner can manage access requests.</p>
      </div>
    )
  }

  const filteredUsers = pendingUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Access Requests</h1>
          <p className="text-slate-500 mt-2">Manage pending approvals for workspace access.</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-1 bg-slate-50/50 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white border-none shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Loading requests...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 max-w-sm mt-1">There are no pending access requests to review at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <motion.div 
                key={u.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-semibold text-lg">
                      {u.full_name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{u.full_name || "Unknown"}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span>{u.email}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600">
                        {u.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-2 font-mono">
                      <Clock className="h-3 w-3" />
                      {new Date(u.created_at).toLocaleDateString()} at {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleReject(u.id)}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                    onClick={() => handleApprove(u.id)}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
