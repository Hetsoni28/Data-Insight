"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Table as TableIcon, FileDigit, AlertTriangle, ArrowRightLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DatasetComparisonViewProps {
  baseDatasetId: string
}

export function DatasetComparisonView({ baseDatasetId }: DatasetComparisonViewProps) {
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedCompareId, setSelectedCompareId] = useState<string>("")
  const [baseData, setBaseData] = useState<any>(null)
  const [compareData, setCompareData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Load available datasets to compare against
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await api.get('/tenant-datasets')
        const allDatasets = res.data?.data || res.data || []
        // filter out the current one
        setDatasets(allDatasets.filter((d: any) => d.id !== baseDatasetId))
      } catch (e) {
        console.error("Failed to load datasets for comparison", e)
      }
    }
    fetchDatasets()
  }, [baseDatasetId])

  // Load the detailed schemas and profiles when selected
  useEffect(() => {
    const loadComparisonData = async () => {
      if (!selectedCompareId) return
      setLoading(true)
      try {
        const [baseRes, baseSch, compRes, compSch] = await Promise.all([
          api.get(`/tenant-datasets/${baseDatasetId}`).catch(()=>({data:{}})),
          api.get(`/tenant-datasets/${baseDatasetId}/schema`).catch(()=>({data:{}})),
          api.get(`/tenant-datasets/${selectedCompareId}`).catch(()=>({data:{}})),
          api.get(`/tenant-datasets/${selectedCompareId}/schema`).catch(()=>({data:{}}))
        ])

        setBaseData({
          details: baseRes.data?.data || baseRes.data,
          schema: baseSch.data?.data || baseSch.data || []
        })
        setCompareData({
          details: compRes.data?.data || compRes.data,
          schema: compSch.data?.data || compSch.data || []
        })
      } catch (e) {
        console.error("Failed to load comparison data", e)
      } finally {
        setLoading(false)
      }
    }
    loadComparisonData()
  }, [baseDatasetId, selectedCompareId])

  if (!selectedCompareId) {
    return (
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
          <ArrowRightLeft className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Compare Datasets</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Select another dataset from your workspace to view a side-by-side comparison of data quality, schemas, and metrics.</p>
        
        <div className="w-full max-w-sm mx-auto text-left">
          <Select onValueChange={(v: any) => setSelectedCompareId(v as string)}>
            <SelectTrigger className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Select a dataset to compare..." />
            </SelectTrigger>
            <SelectContent>
              {datasets.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  if (loading || !baseData || !compareData) {
    return (
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50" />
        <Skeleton className="h-[400px] rounded-3xl bg-slate-200/50 dark:bg-slate-800/50" />
      </div>
    )
  }

  const b = baseData.details || {}
  const c = compareData.details || {}

  const bCols = baseData.schema || []
  const cCols = compareData.schema || []

  // Shared columns analysis
  const bColNames = new Set(bCols.map((x:any) => x.name))
  const cColNames = new Set(cCols.map((x:any) => x.name))
  const sharedCols = [...bColNames].filter(x => cColNames.has(x))
  const onlyB = [...bColNames].filter(x => !cColNames.has(x))
  const onlyC = [...cColNames].filter(x => !bColNames.has(x))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Selector Row */}
      <div className="flex justify-end">
        <div className="w-72">
          <Select value={selectedCompareId} onValueChange={(v: any) => setSelectedCompareId(v as string)}>
            <SelectTrigger className="bg-white dark:bg-slate-800">
              <SelectValue placeholder="Change dataset..." />
            </SelectTrigger>
            <SelectContent>
              {datasets.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Stats Comparison */}
      <div className="grid grid-cols-2 gap-8">
        {/* Base Dataset */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">{b.name}</h3>
            <Badge variant="outline" className="mt-2 bg-white dark:bg-slate-900">{b.file_type?.toUpperCase()}</Badge>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500"><TableIcon className="w-4 h-4 mr-2"/> Rows</div>
              <div className="font-bold text-lg">{(b.row_count || 0).toLocaleString()}</div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500"><FileDigit className="w-4 h-4 mr-2"/> Columns</div>
              <div className="font-bold text-lg">{b.column_count || bCols.length}</div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500"><ShieldCheck className="w-4 h-4 mr-2"/> Quality Score</div>
              <div className={`font-bold text-lg ${b.data_quality_score >= 80 ? 'text-emerald-500' : b.data_quality_score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                {b.data_quality_score || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Compare Dataset */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 overflow-hidden shadow-sm shadow-emerald-900/10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 border-b border-emerald-100 dark:border-emerald-800/50 relative z-10">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate">{c.name}</h3>
            <Badge variant="outline" className="mt-2 bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">{c.file_type?.toUpperCase()}</Badge>
          </div>
          <div className="p-6 space-y-6 relative z-10">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500"><TableIcon className="w-4 h-4 mr-2"/> Rows</div>
              <div className="font-bold text-lg flex items-center gap-2">
                {(c.row_count || 0).toLocaleString()}
                {(c.row_count || 0) > (b.row_count || 0) && b.row_count > 0 ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">+{((c.row_count - b.row_count)/b.row_count * 100).toFixed(1)}%</Badge> : 
                 (c.row_count || 0) < (b.row_count || 0) && b.row_count > 0 ? <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100">{((c.row_count - b.row_count)/b.row_count * 100).toFixed(1)}%</Badge> : null}
              </div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500"><FileDigit className="w-4 h-4 mr-2"/> Columns</div>
              <div className="font-bold text-lg">{c.column_count || cCols.length}</div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500"><ShieldCheck className="w-4 h-4 mr-2"/> Quality Score</div>
              <div className={`font-bold text-lg ${c.data_quality_score >= 80 ? 'text-emerald-500' : c.data_quality_score >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                {c.data_quality_score || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schema Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <ArrowRightLeft className="w-5 h-5 mr-3 text-indigo-500" />
          Schema Overlap
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="text-sm font-semibold text-slate-500 mb-4">Only in {b.name || "Base"}</div>
            <div className="flex flex-wrap gap-2">
              {onlyB.length === 0 ? <span className="text-sm text-slate-400">None</span> : 
               onlyB.map((col: any) => <Badge key={col} variant="secondary" className="bg-white dark:bg-slate-900 border-slate-200">{col}</Badge>)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50">
            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4">Shared Columns ({sharedCols.length})</div>
            <div className="flex flex-wrap gap-2">
              {sharedCols.length === 0 ? <span className="text-sm text-indigo-400">No overlapping columns</span> : 
               sharedCols.map((col: any) => <Badge key={col} className="bg-indigo-100 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300">{col}</Badge>)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4">Only in {c.name || "Compare"}</div>
            <div className="flex flex-wrap gap-2">
              {onlyC.length === 0 ? <span className="text-sm text-emerald-400">None</span> : 
               onlyC.map((col: any) => <Badge key={col} className="bg-emerald-100 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300">{col}</Badge>)}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
