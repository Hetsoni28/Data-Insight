import { X, Database, Play, Loader2 } from "lucide-react"
import { useState } from "react"

export function DatasetActionModal({ 
  isOpen, 
  onClose, 
  action, 
  datasets,
  onConfirm 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  action: string,
  datasets: any[],
  onConfirm: (datasetId: string, action: string) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const getActionLabel = () => {
    switch(action) {
      case 'ai-excel': return 'Generate AI Excel'
      case 'dashboard': return 'Create Dashboard'
      case 'analyze': return 'Analyze Dataset'
      default: return 'Run Action'
    }
  }

  const handleConfirm = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      await onConfirm(selectedId, action)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {getActionLabel()}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Select a dataset from your workspace to run the <span className="font-semibold text-slate-700 dark:text-slate-300">{getActionLabel()}</span> workflow.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {datasets.filter(d => d.status === 'ready').length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No ready datasets available.</p>
              </div>
            ) : (
              datasets.filter(d => d.status === 'ready').map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedId === d.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedId === d.id ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.row_count} rows • {d.column_count} cols</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedId || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? 'Starting...' : getActionLabel()}
          </button>
        </div>
      </div>
    </div>
  )
}
