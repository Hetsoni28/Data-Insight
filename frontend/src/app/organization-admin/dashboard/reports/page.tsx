import dynamic from "next/dynamic"
"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { toast } from "sonner"

import { ReportExplorerTable, Report } from "@/components/organisms/ReportExplorerTable"
import { ReportScheduleService, ReportSchedule } from "@/lib/report.service"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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


export default function ReportsCenterPage() {
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

  const fetchData = async () => {
    try {
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
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleQuickAction = (action: string) => {
    if (action === 'schedule') {
      setIsScheduleModalOpen(true)
    } else {
      setCurrentAction(action)
      setIsModalOpen(true)
    }
  }

  const handleRowAction = async (action: string, id: string) => {
    if (action === 'delete' || action === 'archive') {
      if (!confirm(`Are you sure you want to ${action} this report?`)) return
      try {
        await api.post(`/tenant-reports/${id}/action/delete`)
        toast.success(`Report ${action}d successfully`)
        fetchData()
      } catch (e) {
        toast.error(`Failed to ${action} report`)
      }
    } else if (action === 'preview') {
      setViewingReportId(id)
      setIsViewerOpen(true)
    } else if (action === 'export') {
      setExportReportId(id)
      setIsExportModalOpen(true)
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
      } catch(e) {
        toast.error("Failed to download report", { id: `dl-${id}` })
      }
    } else {
      toast.info(`Action ${action} is mocked for this iteration.`)
      // Mocked endpoint execution just to log the audit trail
      try {
        await api.post(`/tenant-reports/${id}/action/${action}`)
        fetchData()
      } catch(e) {}
    }
  }

  return (
    <div className="w-full h-full flex flex-col p-8 bg-slate-50 dark:bg-[#0B0F17] overflow-y-auto custom-scrollbar">
      
      <div className="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-base">
            Enterprise Business Intelligence reporting hub. Generate, schedule, and analyze AI-powered business reports.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Top Section: KPIs & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ReportExecutiveKPIs stats={stats} />
            <ReportQuickActions onAction={handleQuickAction} />
          </div>
          
          {/* Timeline in a smaller side panel at the top */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <ReportAuditTimeline logs={activities} isLoading={isLoading} />
          </div>
        </div>

        {/* Full Width Table Area */}
        <div className="w-full">
          <Tabs defaultValue="reports" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="reports">Generated Reports</TabsTrigger>
                <TabsTrigger value="builder">Report Builder</TabsTrigger>
                <TabsTrigger value="schedules">Schedules & Templates</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="reports" className="space-y-4">
              <ReportFilters onFilterChange={(filters) => console.log("Filters changed:", filters)} />
              <ReportExplorerTable 
                reports={reports}
                isLoading={isLoading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAction={handleRowAction}
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
        </div>
        
      </div>

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
