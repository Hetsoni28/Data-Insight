"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { Database, Plus, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/molecules/StatusBadge"
import { formatDistanceToNow } from "date-fns"

interface Dataset { id: string; name: string; rows: number; columns: number; status: string; created_at: string }

export function OrganizationDatasets({ datasets }: { datasets: Dataset[] }) {
  const items = datasets || []
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
            <Database className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Recent Datasets</h3>
          <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 text-[10px] font-bold px-2 py-0.5">{items.length}</Badge>
        </div>
        <Link href="/organization-admin/dashboard/datasets">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 px-3 py-1.5 rounded-xl transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />Upload
          </motion.button>
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
        {items.length === 0 && (
          <div className="py-12 text-center">
            <Database className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No datasets yet.</p>
          </div>
        )}
        {items.map(d => (
          <motion.div 
            key={d.id} 
            whileHover={{ x: 2 }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0 border border-blue-100 dark:border-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Database className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{d.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {d.rows?.toLocaleString()} rows &bull; {d.columns} cols &bull; {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
              </p>
            </div>
            <StatusBadge status={d.status} />
          </motion.div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <Link href="/organization-admin/dashboard/datasets">
          <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-1">
            View all datasets <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </div>
  )
}
