"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { ShieldCheck, Table as TableIcon, FileDigit, Info, Calendar, ArrowLeft, BrainCircuit, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

import { DatasetHeaderBanner } from "@/components/molecules/DatasetHeaderBanner"
import { DatasetMetricsGrid, DatasetMetric } from "@/components/organisms/DatasetMetricsGrid"
import { DatasetDetailTabs } from "@/components/organisms/DatasetDetailTabs"
import { ReportSchedulerModal } from "@/components/organisms/ReportSchedulerModal"
import { toast } from "sonner"

interface DatasetDetailExplorerProps {
  backHref?: string
  backLabel?: string
}

export function DatasetDetailExplorer({ 
  backHref = "/viewer/dashboard/datasets",
  backLabel = "Back to Datasets"
}: DatasetDetailExplorerProps = {}) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const roleMatch = pathname?.match(/^\/(owner|organization-admin|manager|analyst|viewer)/)
  const defaultBackHref = roleMatch ? `${roleMatch[0]}/dashboard/datasets` : "/viewer/dashboard/datasets"
  const finalBackHref = backHref === "/viewer/dashboard/datasets" ? defaultBackHref : backHref

  const { data: user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [dataset, setDataset] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [schema, setSchema] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [charts, setCharts] = useState<any[]>([])
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")

  useEffect(() => {
    if (params.id) {
      const fetchAll = async () => {
        try {
          setLoading(true)
          
          // These endpoints exist on the backend
          const dsPromise = api.get(`/tenant-datasets/${params.id}`);
          const schPromise = api.get(`/tenant-datasets/${params.id}/schema`).catch(() => ({ data: [] }));
          const prevPromise = api.get(`/tenant-datasets/${params.id}/preview`).catch(() => ({ data: { columns: [], rows: [] } }));
          const insPromise = api.get(`/tenant-datasets/${params.id}/insights`).catch(() => ({ data: { summary: "No insights available.", metrics: [] } }));
          const chPromise = api.get(`/tenant-datasets/${params.id}/charts`).catch(() => ({ data: [] }));

          const [dsRes, schRes, prevRes, insRes, chRes] = await Promise.all([
            dsPromise, schPromise, prevPromise, insPromise, chPromise
          ])
          
          setDataset(dsRes.data?.data || dsRes.data)
          setSchema(schRes.data?.data || schRes.data || [])
          setPreview(prevRes.data?.data || prevRes.data)
          setInsights(insRes.data?.data || insRes.data)
          setCharts(chRes.data?.data || chRes.data || [])
        } catch (error) {
          console.error("Failed to load dataset details", error)
        } finally {
          setLoading(false)
        }
      }
      fetchAll()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-10">
          <Skeleton className="h-12 w-12 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-80 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />
            <Skeleton className="h-5 w-60 rounded-lg bg-slate-200/50 dark:bg-slate-800/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl bg-slate-200/50 dark:bg-slate-800/50" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full rounded-3xl mt-8 bg-slate-200/50 dark:bg-slate-800/50" />
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[80vh]">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
             <TableIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Dataset Not Found</h2>
          <p className="text-slate-500 font-medium mb-8 max-w-sm text-center">We couldn't locate this dataset, or you may not have permission to view it.</p>
          <Button onClick={() => router.push(backHref)} className="bg-emerald-600 hover:bg-emerald-500 h-12 px-8 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Datasets
          </Button>
        </motion.div>
      </div>
    )
  }

  const detailMetrics: DatasetMetric[] = [
    {
      title: "Total Rows",
      value: dataset.row_count?.toLocaleString() || "0",
      icon: <TableIcon className="w-4 h-4 text-blue-500" />,
      colorClass: "bg-blue-500/5 group-hover:bg-blue-500/10",
    },
    {
      title: "Columns",
      value: dataset.column_count?.toString() || "0",
      icon: <FileDigit className="w-4 h-4 text-purple-500" />,
      colorClass: "bg-purple-500/5 group-hover:bg-purple-500/10",
    },
    {
      title: "Department",
      value: dataset.department || "Business Analytics",
      icon: <Info className="w-4 h-4 text-amber-500" />,
      colorClass: "bg-amber-500/5 group-hover:bg-amber-500/10",
    },
    {
      title: "Last Updated",
      value: new Date(dataset.updated_at).toLocaleDateString(),
      icon: <Calendar className="w-4 h-4 text-emerald-500" />,
      colorClass: "bg-emerald-500/5 group-hover:bg-emerald-500/10",
    }
  ]

  const headerBadges = (
    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-3 py-1 backdrop-blur-md rounded-xl font-bold mt-1">
      <ShieldCheck className="w-4 h-4 mr-1.5" />
      Verified Enterprise Data
    </Badge>
  )

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 h-full overflow-y-auto pb-32">
      <DatasetHeaderBanner
        title={dataset.name}
        description={dataset.description || "Enterprise dataset available for read-only analytical exploration and AI insights."}
        badges={headerBadges}
        showBack={true}
        backLink={finalBackHref}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => {
                setActiveTab("insights")
                setTimeout(() => {
                  document.querySelector('[data-radix-tabs-content]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }}
              className="bg-emerald-500 hover:bg-emerald-400 border-none text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] h-12 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
              <BrainCircuit className="w-5 h-5 mr-2.5" />
              AI Gen Report
            </Button>
            <Button 
              onClick={() => {
                setActiveTab("charts")
                setTimeout(() => {
                  document.querySelector('[data-radix-tabs-content]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }}
              variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-md h-12 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
              <LineChart className="w-5 h-5 mr-2.5 text-emerald-400" />
              AI Forecasting
            </Button>

            {['owner', 'organization-admin', 'manager'].includes(user?.role || '') && (
              <Button 
                onClick={() => setIsScheduleModalOpen(true)}
                variant="outline" 
                className="bg-transparent border-emerald-500/30 text-white hover:bg-emerald-500/20 hover:text-white backdrop-blur-md h-12 px-6 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">
                <Calendar className="w-5 h-5 mr-2.5 text-emerald-400" />
                Schedule
              </Button>
            )}
            
            <div className="flex rounded-xl overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Button 
                onClick={async () => {
                  if (!dataset.excel_url) {
                    toast.warning("Excel not generated yet. Trigger 'Generate AI Excel' from the Datasets list to create one.")
                    return
                  }
                  try {
                    toast.loading("Preparing Excel download...")
                    const dlRes = await api.get(`/tenant-datasets/${dataset.id}/excel-download`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([dlRes.data]));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `AI_Excel_${dataset.name}.xlsx`;
                    a.click();
                    toast.dismiss()
                    toast.success("Excel downloaded successfully!")
                  } catch (e) {
                    toast.dismiss()
                    toast.error("Excel download failed. Please try again.")
                    console.error("Download failed", e);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 border-r border-emerald-700/50 text-white h-12 px-5 rounded-none font-bold transition-colors">
                Download Excel
              </Button>
              <Button 
                onClick={async () => {
                  if (!dataset.pdf_url) {
                    toast.warning("PDF not generated yet. Upload a new dataset to auto-generate the PDF report.")
                    return;
                  }
                  try {
                    toast.loading("Preparing PDF download...")
                    const dlRes = await api.get(`/tenant-datasets/${dataset.id}/pdf-download`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([dlRes.data]));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `AI_Report_${dataset.name}.pdf`;
                    a.click();
                    toast.dismiss()
                    toast.success("PDF downloaded successfully!")
                  } catch (e) {
                    toast.dismiss()
                    toast.error("PDF download failed. Please try again.")
                    console.error("Download failed", e);
                  }
                }}
                title={dataset.pdf_url ? "Download AI PDF Report" : "PDF not generated yet — upload a new dataset"}
                className={`h-12 px-5 rounded-none font-bold transition-colors border-none ${dataset.pdf_url ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300 cursor-not-allowed'}`}>
                {dataset.pdf_url ? 'Download PDF' : 'PDF Not Ready'}
              </Button>
            </div>
          </div>
        }
      />

      <DatasetMetricsGrid metrics={detailMetrics} />

      <DatasetDetailTabs 
        preview={preview}
        schema={schema}
        insights={insights}
        charts={charts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ReportSchedulerModal 
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onScheduleCreated={() => {}}
        initialDatasetId={dataset.id}
      />
    </div>
  )
}
