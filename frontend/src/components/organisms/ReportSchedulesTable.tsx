"use client"

import { useState, useEffect } from "react"
import { Clock, Play, Pause, Trash2, CalendarClock } from "lucide-react"
import { ReportScheduleService, ReportSchedule } from "@/lib/report.service"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"

interface ReportSchedulesTableProps {
  schedules: ReportSchedule[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReportSchedulesTable({ schedules, isLoading, onRefresh }: ReportSchedulesTableProps) {
  const [toggling, setToggling] = useState<string | null>(null)

  const handleToggle = async (id: string) => {
    setToggling(id)
    try {
      await ReportScheduleService.toggle(id)
      toast.success("Schedule status updated")
      onRefresh()
    } catch (e) {
      toast.error("Failed to update schedule")
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return
    try {
      await ReportScheduleService.delete(id)
      toast.success("Schedule deleted")
      onRefresh()
    } catch (e) {
      toast.error("Failed to delete schedule")
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading schedules...</div>
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl">
        <CalendarClock className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No active schedules</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
          Automate your reporting by creating a new AI report schedule.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Name & Template</th>
              <th className="px-6 py-4 font-medium">Schedule (CRON)</th>
              <th className="px-6 py-4 font-medium">Next Run</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {schedules.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">{s.report_category.replace('-', ' ')}</div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                  {s.cron_expression}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{format(new Date(s.next_run_at), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(s.next_run_at), { addSuffix: true })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {s.is_active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-white/5 dark:text-slate-400">
                      Paused
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggle(s.id)}
                      disabled={toggling === s.id}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded disabled:opacity-50"
                      title={s.is_active ? "Pause" : "Resume"}
                    >
                      {s.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
