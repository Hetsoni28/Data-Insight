"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Trash2, Plus, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface DatasetAlertsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasetId: string
  schema: any[]
}

export function DatasetAlertsModal({ open, onOpenChange, datasetId, schema }: DatasetAlertsModalProps) {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [name, setName] = useState("High Churn Alert")
  const [column, setColumn] = useState("")
  const [condition, setCondition] = useState(">")
  const [threshold, setThreshold] = useState("0")

  useEffect(() => {
    if (open) {
      fetchAlerts()
    }
  }, [open, datasetId])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/tenant-datasets/${datasetId}/alerts`)
      setAlerts(res.data?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tenant-datasets/${datasetId}/alerts/${id}`)
      toast.success("Alert deleted")
      fetchAlerts()
    } catch (e) {
      toast.error("Failed to delete alert")
    }
  }

  const handleCreate = async () => {
    if (!name || !column || !threshold) {
      toast.error("Please fill in all fields")
      return
    }
    setSaving(true)
    try {
      await api.post(`/tenant-datasets/${datasetId}/alerts`, {
        name,
        metric_column: column,
        condition,
        threshold_value: parseFloat(threshold)
      })
      toast.success("Alert created! Monitoring is now active.")
      setName("New Alert")
      setThreshold("0")
      fetchAlerts()
    } catch (e) {
      toast.error("Failed to create alert")
    } finally {
      setSaving(false)
    }
  }

  const numericColumns = schema?.filter(c => c.type.includes('INT') || c.type.includes('FLOAT') || c.type.includes('DOUBLE')) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Bell className="w-6 h-6 mr-3 text-emerald-500" /> Data Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified instantly when data breaches your custom thresholds.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-white">Create New Alert</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Alert Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales dropped" className="mt-1" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Metric Column</label>
                <Select value={column} onValueChange={(v) => setColumn(v || "")}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select column" /></SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Condition</label>
                  <Select value={condition} onValueChange={(v) => setCondition(v || "")}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">"> &gt; Greater than</SelectItem>
                      <SelectItem value="<"> &lt; Less than</SelectItem>
                      <SelectItem value="=="> == Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Threshold</label>
                  <Input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Alert
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-white">Active Alerts ({alerts.length})</h4>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No active alerts set up for this dataset.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {alerts.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{a.name}</p>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        WHERE {a.metric_column} {a.condition} {a.threshold_value}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
