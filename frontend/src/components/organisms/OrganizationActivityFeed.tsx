"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import { Activity, LogIn, UploadCloud, FileText, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export function OrganizationActivityFeed({ activity }: { activity: any[] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  if (!activity || activity.length === 0) return null

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <LogIn className="h-4 w-4 text-emerald-500" />
    if (action.includes('dataset') || action.includes('upload')) return <UploadCloud className="h-4 w-4 text-emerald-500" />
    if (action.includes('report') || action.includes('generate')) return <FileText className="h-4 w-4 text-emerald-500" />
    if (action.includes('admin') || action.includes('permission')) return <Shield className="h-4 w-4 text-rose-500" />
    return <Activity className="h-4 w-4 text-slate-500" />
  }

  const formatActionName = (action: string) => {
    return action.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const totalPages = Math.ceil(activity.length / itemsPerPage)
  const paginatedActivity = activity.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col">
      <div className="mb-6 shrink-0">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Organization Timeline</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Live feed of organization events.</p>
      </div>

      <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-5 space-y-6 flex-1 mt-4">
        {paginatedActivity.map((item, i) => (
          <div key={item.id || i} className="relative pl-6">
            <span className="absolute -left-[21px] top-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#09090b] bg-slate-100 dark:bg-slate-800 shadow-sm z-10">
              {getActionIcon(item.action)}
            </span>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2">{formatActionName(item.action)}</span>
                  <Badge variant={item.status === 'success' ? 'default' : 'destructive'} className={item.status === 'success' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}>
                    {item.status === 'success' ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {item.created_at ? format(new Date(item.created_at), 'MMM d, h:mm a') : 'Just now'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activity.length > 0 && (
        <div className="mt-8 pt-4">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={activity.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {}}
            pageSizeOptions={[5]}
          />
        </div>
      )}
    </div>
  )
}
