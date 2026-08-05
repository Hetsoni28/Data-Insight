import { useState, useEffect } from "react"
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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
            Security & Audit
          </h3>
          <p className="text-sm text-slate-500">Monitor organization activity and active user sessions.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "audit" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "sessions" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Active Sessions
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {activeTab === "audit" ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading audit logs...</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No audit logs found.</td></tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(log.severity)}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{log.action}</p>
                          <p className="text-xs text-slate-500">{log.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{log.actor?.name || "System"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-white/10">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ip_address || "Unknown"}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-black/20">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Device / OS</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading sessions...</td></tr>
              ) : activeSessions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No active sessions found.</td></tr>
              ) : (
                activeSessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{session.user_name}</p>
                        <p className="text-xs text-slate-500">{session.user_email}</p>
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
                        <span className="text-slate-900 dark:text-white">{session.os || "Unknown OS"}</span>
                        <span className="text-slate-500 text-xs">({session.browser || "Unknown Browser"})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        {session.location || "Unknown Location"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{session.ip_address || "Unknown"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400">
                        <Activity className="w-4 h-4" />
                        {new Date(session.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
