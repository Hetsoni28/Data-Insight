"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Copy, Link, Trash2, Plus, Check, ExternalLink, Shield } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface ShareLink {
  token: string
  label: string | null
  is_active: boolean
  expires_at: string | null
  view_count: number
  allow_excel_download: boolean
  allow_clean_download: boolean
  created_at: string
}

interface ShareDatasetModalProps {
  open: boolean
  onClose: () => void
  datasetId: string
  datasetName: string
}

const EXPIRY_OPTIONS = [
  { label: "Never", value: null },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
]

function getShareUrl(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : ""
  return `${base}/share/${token}`
}

export default function ShareDatasetModal({ open, onClose, datasetId, datasetName }: ShareDatasetModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // New link form state
  const [label, setLabel] = useState("")
  const [expiryDays, setExpiryDays] = useState<number | null>(null)
  const [allowExcel, setAllowExcel] = useState(true)
  const [allowClean, setAllowClean] = useState(true)

  useEffect(() => {
    if (open && datasetId) fetchLinks()
  }, [open, datasetId])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/share-links/by-dataset/${datasetId}`)
      setLinks(res.data.data || [])
    } catch {
      toast.error("Could not load share links")
    } finally { setLoading(false) }
  }

  const createLink = async () => {
    setCreating(true)
    try {
      let expires_at: string | null = null
      if (expiryDays) {
        const d = new Date()
        d.setDate(d.getDate() + expiryDays)
        expires_at = d.toISOString()
      }
      const res = await api.post("/share-links", {
        dataset_id: datasetId,
        label: label || null,
        expires_at,
        allow_excel_download: allowExcel,
        allow_clean_download: allowClean,
      })
      setLinks(prev => [res.data.data, ...prev])
      setLabel("")
      setExpiryDays(null)
      toast.success("Share link created!")
    } catch {
      toast.error("Failed to create share link")
    } finally { setCreating(false) }
  }

  const revokeLink = async (token: string) => {
    try {
      await api.delete(`/share-links/${token}`)
      setLinks(prev => prev.filter(l => l.token !== token))
      toast.success("Link revoked")
    } catch {
      toast.error("Failed to revoke link")
    }
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getShareUrl(token))
    setCopiedToken(token)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-emerald-500" />
            Share with Client
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Generate a secure, read-only link for <strong>{datasetName}</strong>. Clients can view the quality report and download files without needing to log in.
          </p>
        </DialogHeader>

        {/* Create New Link */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 mt-2">
          <p className="text-sm font-semibold text-slate-700">Create New Share Link</p>

          <div className="space-y-2">
            <Label htmlFor="link-label" className="text-xs font-medium text-slate-600">
              Label (optional) — e.g. "Shared with Acme Corp"
            </Label>
            <Input
              id="link-label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Enter a label..."
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-600">Link Expiry</Label>
            <div className="flex gap-2 flex-wrap">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setExpiryDays(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    expiryDays === opt.value
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={allowExcel} onCheckedChange={setAllowExcel} id="allow-excel" />
              <Label htmlFor="allow-excel" className="text-xs text-slate-600 cursor-pointer">Allow AI Excel download</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={allowClean} onCheckedChange={setAllowClean} id="allow-clean" />
              <Label htmlFor="allow-clean" className="text-xs text-slate-600 cursor-pointer">Allow Clean Data download</Label>
            </div>
          </div>

          <Button onClick={createLink} disabled={creating} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
            {creating
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Creating...</>
              : <><Plus className="w-4 h-4 mr-2" />Generate Share Link</>}
          </Button>
        </div>

        {/* Existing Links */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : links.length > 0 ? (
          <div className="space-y-3 mt-2">
            <p className="text-sm font-semibold text-slate-700">Active Share Links ({links.length})</p>
            {links.map(link => (
              <div key={link.token} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                {link.label && (
                  <p className="text-xs font-semibold text-emerald-600">{link.label}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono truncate border border-slate-200">
                    {getShareUrl(link.token)}
                  </div>
                  <button
                    onClick={() => copyLink(link.token)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Copy link"
                  >
                    {copiedToken === link.token ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                  <a
                    href={getShareUrl(link.token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </a>
                  <button
                    onClick={() => revokeLink(link.token)}
                    className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition-colors"
                    title="Revoke link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{link.view_count} views</span>
                  {link.expires_at && <span>Expires {new Date(link.expires_at).toLocaleDateString()}</span>}
                  <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                  {link.allow_excel_download && <span className="text-indigo-500">Excel ✓</span>}
                  {link.allow_clean_download && <span className="text-emerald-500">Clean ✓</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            <Link className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No share links yet. Create one above.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
