"use client"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Blocks, Key, Settings2, Trash2, X, Copy, Check, Loader2, AlertTriangle, Eye, EyeOff, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PaginationControls } from "@/components/molecules/PaginationControls"

interface GatewayDeveloperAppsProps {
  apps: any[]
}

// ─── View Secret Modal ──────────────────────────────────────────────────────
function ViewSecretModal({ app, onClose }: { app: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)
  // We don't expose the secret unless generating a new one
  const secretDisplay = "cs_********************"

  const handleCopy = () => {
    navigator.clipboard.writeText(secretDisplay)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Client secret copied to clipboard")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Client Credentials</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Application</p>
              <p className="font-semibold text-slate-900 dark:text-white">{app.name}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Client ID</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg px-3 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
              <span className="flex-1 break-all">{app.id}</span>
              <button onClick={() => { navigator.clipboard.writeText(app.id); toast.success("Client ID copied") }}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0 transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Client Secret</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg px-3 py-2.5 font-mono text-xs">
              <span className="flex-1 text-emerald-600 dark:text-emerald-300 break-all">{secretDisplay}</span>
              <button onClick={() => setShow(!show)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0 transition-colors">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleCopy} className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="w-3 h-3" />
              Store this securely — never expose in client-side code
            </p>
          </div>

          <Button onClick={onClose} className="w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white border border-slate-200/60 dark:border-white/10 mt-2">Close</Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Settings Modal ─────────────────────────────────────────────────────────
function SettingsModal({ app, onClose }: { app: any; onClose: () => void }) {
  const [name, setName] = useState(app.name)
  const [active, setActive] = useState(app.is_active)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/owner/api-gateway/oauth-clients/${app.id}`, { name, active })
      toast.success(`Application "${name}" settings saved`)
      onClose()
    } catch {
      toast.error("Failed to save application settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">App Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Application Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Application Status</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enable or disable this OAuth client</p>
            </div>
            <button
              onClick={() => setActive(!active)}
              className={`relative w-12 h-6 rounded-full transition-colors ${active ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/10"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${active ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Scopes</label>
            <div className="flex flex-wrap gap-1.5">
              {app.scopes.map((s: string) => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 font-mono">{s}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────
function DeleteModal({ app, onClose, onConfirm }: { app: any; onClose: () => void; onConfirm: () => void }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/owner/api-gateway/oauth-clients/${app.id}`)
      toast.success(`Application "${app.name}" has been revoked`)
      onConfirm()
      onClose()
    } catch {
      toast.error("Failed to revoke application")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-red-500/20 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revoke Application</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">This will immediately revoke all access for <span className="text-slate-900 dark:text-white font-medium">&quot;{app.name}&quot;</span>. This action cannot be undone.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
          <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-500 text-white">
            {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Revoking...</> : <><Trash2 className="w-4 h-4 mr-2" />Revoke Access</>}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Register App Modal ─────────────────────────────────────────────────────
function RegisterAppModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [redirectUri, setRedirectUri] = useState("")
  const [scopes, setScopes] = useState<string[]>(["read:datasets"])
  const [registering, setRegistering] = useState(false)
  const [done, setDone] = useState(false)

  const scopeOptions = ["read:all", "write:all", "read:datasets", "write:datasets", "read:reports", "write:reports"]
  const toggleScope = (s: string) => setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleRegister = async () => {
    if (!name.trim()) { toast.error("Application name is required"); return }
    if (!redirectUri.trim()) { toast.error("Redirect URI is required"); return }
    setRegistering(true)
    try {
      await api.post("/owner/api-gateway/oauth-clients", { name, redirect_uri: redirectUri, scopes })
      setDone(true)
      queryClient.invalidateQueries({ queryKey: ['api-gateway', 'oauth-clients'] })
      toast.success(`Application "${name}" registered successfully`)
      setTimeout(() => { setDone(false); setName(""); setRedirectUri(""); setScopes(["read:datasets"]); onClose() }, 1500)
    } catch {
      toast.error("Failed to register application")
    } finally {
      setRegistering(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-card/95 dark:backdrop-blur-2xl border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register Application</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Application Name <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile Dashboard, Zapier Integration..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Redirect URI <span className="text-red-500">*</span></label>
                <input value={redirectUri} onChange={e => setRedirectUri(e.target.value)} placeholder="https://yourapp.com/callback"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Requested Scopes</label>
                <div className="grid grid-cols-2 gap-2">
                  {scopeOptions.map(s => (
                    <button key={s} onClick={() => toggleScope(s)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs font-mono transition-all ${scopes.includes(s)
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"}`}>
                      {scopes.includes(s) && <Check className="w-3 h-3 inline mr-1" />}{s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10">Cancel</Button>
                <Button onClick={handleRegister} disabled={registering || done} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                  {done ? <><Check className="w-4 h-4 mr-2" />Registered!</>
                    : registering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registering...</>
                      : <><Plus className="w-4 h-4 mr-2" />Register App</>}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function GatewayDeveloperApps({ apps }: GatewayDeveloperAppsProps) {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [secretApp, setSecretApp] = useState<any>(null)
  const [settingsApp, setSettingsApp] = useState<any>(null)
  const [deleteApp, setDeleteApp] = useState<any>(null)
  const [localApps, setLocalApps] = useState<any[]>(apps || [])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sync with parent prop
  if (apps && apps !== localApps && !secretApp && !settingsApp && !deleteApp) {
    setLocalApps(apps)
  }

  const handleDelete = (id: string) => {
    setLocalApps(prev => prev.filter(a => a.id !== id))
  }

  if (!localApps || localApps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm mt-6"
      >
        <RegisterAppModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Blocks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Developer Applications</h3>
          </div>
          <Button onClick={() => setRegisterOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="w-4 h-4 mr-2" />Register Application
          </Button>
        </div>
        <div className="p-12 text-center text-slate-500">
          <Blocks className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No Applications Registered</p>
          <p className="text-sm mt-1">Register your first OAuth client to get started.</p>
        </div>
      </motion.div>
    )
  }

  const totalItems = localApps.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedApps = localApps.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <>
      {/* Modals */}
      <RegisterAppModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
      <AnimatePresence>
        {secretApp && <ViewSecretModal app={secretApp} onClose={() => setSecretApp(null)} />}
        {settingsApp && <SettingsModal app={settingsApp} onClose={() => setSettingsApp(null)} />}
        {deleteApp && <DeleteModal app={deleteApp} onClose={() => setDeleteApp(null)} onConfirm={() => handleDelete(deleteApp.id)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm mt-6"
      >
        <div className="p-6 border-b border-slate-200/60 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Blocks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Developer Applications</h3>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-medium">{localApps.length}</span>
          </div>
          <Button onClick={() => setRegisterOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />Register Application
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50/80 dark:bg-white/5 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/60 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Application</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Usage</th>
                <th className="px-6 py-4">Scopes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200/60 dark:border-white/5">
                        <Blocks className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{app.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-[160px]">{app.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {app.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Intl.NumberFormat().format(app.usage_count)} reqs
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {app.scopes.slice(0, 2).map((scope: string) => (
                        <span key={scope} className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 font-mono">
                          {scope}
                        </span>
                      ))}
                      {app.scopes.length > 2 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                          +{app.scopes.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View client credentials"
                        onClick={() => setSecretApp(app)}
                        className="h-8 w-8 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="App settings"
                        onClick={() => setSettingsApp(app)}
                        className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Revoke application"
                        onClick={() => setDeleteApp(app)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </motion.div>
    </>
  )
}
