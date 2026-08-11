"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileSpreadsheet, Loader2, Clock, Database, ChevronRight } from "lucide-react"
import { useWorkspaceStore } from "@/store/workspaceStore"
import api from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface Dataset {
  id: string
  filename: string
  created_at: string
  status: string
}

export function DashboardActivityFeed() {
  const router = useRouter()
  const { activeWs } = useWorkspaceStore()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecent = async () => {
      if (!activeWs?.id) return
      try {
        setLoading(true)
        // Fetch datasets
        const { data } = await api.get(`/datasets?workspace_id=${activeWs.id}`)
        // Sort by newest first and take top 5
        const sorted = data.sort((a: Dataset, b: Dataset) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setDatasets(sorted.slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch recent activity", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecent()
  }, [activeWs?.id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-card rounded-3xl border border-slate-200/60 dark:border-border shadow-sm overflow-hidden flex flex-col h-full"
    >
      <div className="p-6 border-b border-slate-100 dark:border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h3>
        </div>
        <button 
          onClick={() => router.push("/dashboard/datasets")}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View all
        </button>
      </div>

      <div className="flex-1 p-0 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : datasets.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center px-6">
            <Database className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No recent activity</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload a dataset to see it here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-border">
            {datasets.map((item, index) => (
              <li 
                key={item.id} 
                className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex items-center gap-4"
                onClick={() => router.push(`/dashboard/datasets/${item.id}`)}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700 transition-colors">
                    {item.filename || 'Untitled Dataset'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Uploaded {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'processed' ? 'bg-emerald-100 text-emerald-700' : 
                    item.status === 'processing' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}
