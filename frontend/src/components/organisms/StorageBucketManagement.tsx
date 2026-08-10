import { useState } from "react"
import { Database, Lock, Globe, MoreVertical, Loader2, Plus, X, Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { storageService } from "@/lib/storageService"
import { motion, AnimatePresence } from "framer-motion"

interface Bucket {
  id: string
  name: string
  type: string
  is_public: boolean
  region: string
  file_count: number
  total_bytes: number
  created_at: string
}

interface StorageBucketManagementProps {
  buckets?: Bucket[]
}

export function StorageBucketManagement({ buckets = [] }: StorageBucketManagementProps) {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newBucketName, setNewBucketName] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: storageService.createBucket,
    onSuccess: () => {
      toast.success("Bucket created successfully")
      queryClient.invalidateQueries({ queryKey: ['owner-storage'] })
      setIsCreateModalOpen(false)
      setNewBucketName("")
      setIsPublic(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to create bucket")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: storageService.deleteBucket,
    onMutate: (id) => {
      setDeletingId(id)
    },
    onSuccess: () => {
      toast.success("Bucket deleted successfully")
      queryClient.invalidateQueries({ queryKey: ['owner-storage'] })
    },
    onError: () => {
      toast.error("Failed to delete bucket")
    },
    onSettled: () => {
      setDeletingId(null)
    }
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBucketName.trim()) return
    createMutation.mutate({
      name: newBucketName,
      bucket_type: "temp",
      is_public: isPublic
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this bucket and all its contents? This cannot be undone.")) {
      deleteMutation.mutate(id)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-500" />
          Buckets
        </h3>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Bucket
        </button>
      </div>

      <div className="overflow-y-auto p-4 flex-1 space-y-3 custom-scrollbar">
        {buckets.map(bucket => (
          <div key={bucket.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  {bucket.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">
                    {bucket.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{bucket.type.replace('_', ' ')}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/30"></span>
                    <span>{bucket.region}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatBytes(bucket.total_bytes)}</p>
                  <p className="text-xs text-slate-500">{bucket.file_count.toLocaleString()} files</p>
                </div>
                <button 
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete bucket"
                  onClick={() => handleDelete(bucket.id)}
                  disabled={deletingId === bucket.id}
                >
                  {deletingId === bucket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
        {buckets.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Database className="h-8 w-8 mb-2 opacity-50" />
            <p>No buckets found.</p>
          </div>
        )}
      </div>

      {/* Create Bucket Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsCreateModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-card/95 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Database className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Bucket</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    Bucket Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={newBucketName} 
                    onChange={e => setNewBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                    placeholder="e.g. analytics-data-prod"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and hyphens only.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isPublic" 
                    checked={isPublic} 
                    onChange={e => setIsPublic(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  <label htmlFor="isPublic" className="text-sm text-slate-700 dark:text-slate-300">
                    Make bucket public
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateModalOpen(false)} 
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending || !newBucketName} 
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Bucket
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
