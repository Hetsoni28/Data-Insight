"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Key, Smartphone, Laptop, Globe, Monitor, Activity, ShieldCheck, AlertTriangle } from "lucide-react"
import api from "@/lib/api"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export function TeamSecurityAudit() {
  const [activeTab, setActiveTab] = useState("audit")
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination States
  const [auditPage, setAuditPage] = useState(1)
  const [auditPageSize, setAuditPageSize] = useState(10)
  const [auditTotal, setAuditTotal] = useState(0)

  const [sessionPage, setSessionPage] = useState(1)
  const [sessionPageSize, setSessionPageSize] = useState(10)
  const [sessionTotal, setSessionTotal] = useState(0)

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs()
    } else {
      fetchSessions()
    }
  }, [activeTab, auditPage, sessionPage, auditPageSize, sessionPageSize])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/tenant-team/audit-logs?skip=${(auditPage - 1) * auditPageSize}&limit=${auditPageSize}`)
      setAuditLogs(res.data.data)
      setAuditTotal(res.data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/tenant-team/active-sessions?skip=${(sessionPage - 1) * sessionPageSize}&limit=${sessionPageSize}`)
      setActiveSessions(res.data.data)
      setSessionTotal(res.data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <ShieldAlert className="w-4 h-4 text-rose-500" />
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default: return <ShieldCheck className="w-4 h-4 text-emerald-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            Security & Audit Logs
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Monitor organization activity and active user sessions.</p>
        </div>
        <div className="flex bg-slate-200/60 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "audit" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "sessions" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Active Sessions
          </button>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {activeTab === "audit" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium">Loading audit logs...</td></tr>
                ) : auditLogs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium">No audit logs found.</td></tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform duration-300">
                            {getSeverityIcon(log.severity)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{log.action}</p>
                            <p className="text-xs text-slate-500 font-medium">{log.status}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{log.actor?.name || "System"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-white/10">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20 font-semibold">
                          {log.ip_address || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Device / OS</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4 text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium">Loading sessions...</td></tr>
                ) : activeSessions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-500 font-medium">No active sessions found.</td></tr>
                ) : (
                  activeSessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{session.user_name}</p>
                          <p className="text-xs text-slate-500 font-medium">{session.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {session.os?.toLowerCase().includes("mac") || session.os?.toLowerCase().includes("win") ? (
                            <Laptop className="w-4 h-4 text-slate-400" />
                          ) : session.os?.toLowerCase().includes("ios") || session.os?.toLowerCase().includes("android") ? (
                            <Smartphone className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Monitor className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-slate-900 dark:text-white font-bold">{session.os || "Unknown OS"}</span>
                          <span className="text-slate-400 text-xs font-medium">({session.browser || "Unknown Browser"})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400" />
                          {session.location || "Unknown Location"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                        <span className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20 font-semibold">
                          {session.ip_address || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20 inline-flex">
                          <Activity className="w-3.5 h-3.5" />
                          {new Date(session.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {activeTab === "audit" ? (
          <PaginationControls 
            currentPage={auditPage}
            totalPages={Math.ceil(auditTotal / auditPageSize)}
            totalItems={auditTotal}
            pageSize={auditPageSize}
            onPageChange={setAuditPage}
            onPageSizeChange={(size) => { setAuditPageSize(size); setAuditPage(1); }}
          />
        ) : (
          <PaginationControls 
            currentPage={sessionPage}
            totalPages={Math.ceil(sessionTotal / sessionPageSize)}
            totalItems={sessionTotal}
            pageSize={sessionPageSize}
            onPageChange={setSessionPage}
            onPageSizeChange={(size) => { setSessionPageSize(size); setSessionPage(1); }}
          />
        )}
      </div>
    </div>
  )
}
