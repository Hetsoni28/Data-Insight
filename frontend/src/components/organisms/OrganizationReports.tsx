"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { FileText, Plus, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/molecules/StatusBadge"
import { formatDistanceToNow } from "date-fns"

interface Report { id: string; title: string; type: string; status: string; created_at: string }

export function OrganizationReports({ reports }: { reports: Report[] }) {
  const items = reports || []
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">Recent Reports</h3>
          <Badge className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 text-[10px] font-bold px-2 py-0.5">{items.length}</Badge>
        </div>
        <Link href="/organization-admin/dashboard/reports">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/20 px-3 py-1.5 rounded-xl transition-all shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />New
          </motion.button>
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5 flex-1">
        {items.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No reports yet.</p>
          </div>
        )}
        {items.map(r => (
          <motion.div 
            key={r.id} 
            whileHover={{ x: 2 }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex-shrink-0 border border-violet-100 dark:border-violet-500/20 group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{r.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">
                {r.type?.replace(/_/g, " ")} &bull; {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </motion.div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <Link href="/organization-admin/dashboard/reports">
          <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-1">
            View all reports <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </div>
  )
}
