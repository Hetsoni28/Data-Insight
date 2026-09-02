"use client"
import dynamic from "next/dynamic"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { FileText, RefreshCw } from "lucide-react"

import { ReportExplorerTable, Report } from "@/components/organisms/ReportExplorerTable"
import { ReportScheduleService, ReportSchedule } from "@/lib/report.service"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { useWebSocket } from "@/hooks/useWebSocket"



const ReportExecutiveKPIs = dynamic(() => import('@/components/organisms/ReportExecutiveKPIs').then(m => m.ReportExecutiveKPIs), { ssr: false })
const ReportQuickActions = dynamic(() => import('@/components/organisms/ReportQuickActions').then(m => m.ReportQuickActions), { ssr: false })
const ReportAuditTimeline = dynamic(() => import('@/components/organisms/ReportAuditTimeline').then(m => m.ReportAuditTimeline), { ssr: false })
const ReportActionModal = dynamic(() => import('@/components/organisms/ReportActionModal').then(m => m.ReportActionModal), { ssr: false })
const ReportViewerModal = dynamic(() => import('@/components/organisms/ReportViewerModal').then(m => m.ReportViewerModal), { ssr: false })
const ReportSchedulesTable = dynamic(() => import('@/components/organisms/ReportSchedulesTable').then(m => m.ReportSchedulesTable), { ssr: false })
const ReportSchedulerModal = dynamic(() => import('@/components/organisms/ReportSchedulerModal').then(m => m.ReportSchedulerModal), { ssr: false })
const ReportFilters = dynamic(() => import('@/components/organisms/ReportFilters').then(m => m.ReportFilters), { ssr: false })
const ReportExportModal = dynamic(() => import('@/components/organisms/ReportExportModal').then(m => m.ReportExportModal), { ssr: false })
const ReportBuilder = dynamic(() => import('@/components/organisms/ReportBuilder').then(m => m.ReportBuilder), { ssr: false })

export default function AnalystReportsCenterPage() {
  const [stats, setStats] = useState(null)
  const [reports, setReports] = useState<Report[]>([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState("")

  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [viewingReportId, setViewingReportId] = useState<string | null>(null)
  
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportReportId, setExportReportId] = useState("")

  const handleExportSubmit = async (format: string) => {
    try {
      const res = await api.post(`/tenant-reports/${exportReportId}/export`, { format_type: format })
      console.log("Export triggered:", res.data)
      // Ideally trigger a download here
    } catch (e) {
      throw e
    }
  }

  // Explicitly tie fetching to the current workspace
  const { activeWs } = useWorkspaceStore()
  
  // Real-Time WebSocket Updates
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log("[WebSocket] Received event:", message);
    if (!message || !message.type) return;
    
    // Silently refresh the reports on any relevant event
    if (message.type.startsWith("report_") || message.type.startsWith("schedule_")) {
      // Optional: Display a toast when someone else creates a report
      if (message.type === "report_created" && message.payload?.title) {
        toast.info(`New report created: ${message.payload.title}`);
      }
      fetchData(true);
    }
  }, []);
  
  const { isConnected } = useWebSocket({ onMessage: handleWebSocketMessage });

  const fetchData = useCallback(async (silent = false) => {
    // If there is no workspace selected, do not fetch anything.
    if (!activeWs) {
      setReports([])
      setActivities([])
      setSchedules([])
      setIsLoading(false)
      return
    }

    try {
      if (!silent) setIsLoading(true)
      // Use allSettled so one failing API doesn't break the whole page
      const [statsRes, reportsRes, actRes, schedRes] = await Promise.allSettled([
        api.get('/tenant-reports/stats'),
        api.get(`/tenant-reports?search=${searchQuery}`),
        api.get('/tenant-reports/activities'),
        ReportScheduleService.list()
      ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data)
      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.data)
      if (actRes.status === 'fulfilled') setActivities(actRes.value.data.data.audit_logs || [])
      if (schedRes.status === 'fulfilled') setSchedules(schedRes.value)
    } catch (e) {
      console.error("Failed to fetch reports center data", e)
      if (!silent) toast.error("Failed to load workspace reports.")
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [activeWs, searchQuery])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleQuickAction = (action: string) => {
    if (action === 'schedule') {
      setIsScheduleModalOpen(true)
    } else {
      setCurrentAction(action)
      setIsModalOpen(true)
    }
  }

  const handleActionIntercept = (action: string, id?: string) => {
    if (action === 'schedule' && id) {
      setViewingReportId(id)
      setIsScheduleModalOpen(true)
    } else if (action === 'export' && id) {
      setExportReportId(id)
      setIsExportModalOpen(true)
    } else {
      if (id) setViewingReportId(id)
      handleQuickAction(action)
    }
  }

  const handleRowAction = async (action: string, id: string) => {
    if (action === 'delete' || action === 'archive') {
      if (!confirm(`Are you sure you want to ${action} this report?`)) return
      try {
        await api.post(`/tenant-reports/${id}/action/delete`)
        toast.success(`Report ${action}d successfully`)
        fetchData()
      } catch (e: any) {
        toast.error(e.response?.data?.detail || `Failed to ${action} report`)
      }
    } else if (action === 'preview') {
      setViewingReportId(id)
      setIsViewerOpen(true)
    } else if (action === 'download') {
      toast.loading("Preparing download...", { id: `dl-${id}` })
      try {
        const res = await api.get(`/tenant-reports/${id}/download`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `Report_${id.substring(0,8)}.xlsx`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        toast.success("Download complete!", { id: `dl-${id}` })
        fetchData()
      } catch(e: any) {
        toast.error(e.response?.data?.detail || "Failed to download report", { id: `dl-${id}` })
      }
    } else {
      toast.info(`Action ${action} is in development.`)
    }
  }

  if (!activeWs) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 bg-slate-50 dark:bg-[#0B0F17]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Workspace Selected</h2>
          <p className="text-slate-500">Please select a workspace from the sidebar to view reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col p-6 md:p-8 bg-slate-50 dark:bg-[#0B0F17] overflow-y-auto custom-scrollbar relative">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-96 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20"></div>
        <div className="absolute top-12 right-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl opacity-50 dark:opacity-20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-6 rounded-2xl shadow-sm"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            Reports Center
            {isConnected && (
              <span className="flex h-2.5 w-2.5 ml-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" title="Live updates active"></span>
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Workspace Reporting Hub. Generate, schedule, and analyze data securely.
          </p>
        </div>
        
        <button
          onClick={() => fetchData()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-white/10 transition-colors shrink-0 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync Data'}
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-6"
      >
        
        {/* Top Section: KPIs & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            <ReportExecutiveKPIs stats={stats} />
            <ReportQuickActions onAction={handleActionIntercept} />
          </motion.div>
          
          {/* Timeline in a smaller side panel at the top */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1 flex flex-col gap-6"
          >
            <ReportAuditTimeline logs={activities} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Full Width Table Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full"
        >
          <Tabs defaultValue="reports" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="reports">Generated Reports</TabsTrigger>
                <TabsTrigger value="builder">Report Builder</TabsTrigger>
                <TabsTrigger value="schedules">Schedules</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="reports" className="space-y-4">
              <ReportFilters onFilterChange={(filters) => console.log("Filters changed:", filters)} />
              <ReportExplorerTable 
                reports={reports}
                isLoading={isLoading}
                onAction={handleActionIntercept}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </TabsContent>
            
            <TabsContent value="builder">
              <ReportBuilder onSave={async (config) => {
                try {
                  toast.loading("Building query...", { id: "build" })
                  const res = await api.post('/tenant-reports/query', config)
                  toast.success("Query configured successfully!", { id: "build" })
                } catch (e) {
                  toast.error("Failed to build query", { id: "build" })
                }
              }} />
            </TabsContent>
            
            <TabsContent value="schedules">
              <ReportSchedulesTable 
                schedules={schedules}
                isLoading={isLoading}
                onRefresh={fetchData}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
        
      </motion.div>

      <ReportActionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actionType={currentAction}
        onSuccess={fetchData}
      />
      
      <ReportViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        reportId={viewingReportId}
      />
      
      <ReportExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reportId={exportReportId}
        onExport={handleExportSubmit}
      />
      
      <ReportSchedulerModal 
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onScheduleCreated={fetchData}
      />
    </div>
  )
}
