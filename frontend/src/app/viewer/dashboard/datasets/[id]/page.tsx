"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import {
  Database,
  ArrowLeft,
  Calendar,
  Table as TableIcon,
  PieChart,
  BrainCircuit,
  FileDigit,
  Sparkles,
  Info,
  LineChart,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/molecules/MetricCard"
import Link from "next/link"

export default function DatasetDetailExplorer() {
  const params = useParams()
  const router = useRouter()
  const { data: user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [dataset, setDataset] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [schema, setSchema] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [charts, setCharts] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      const fetchAll = async () => {
        try {
          setLoading(true)
          const [dsRes, prevRes, schRes, insRes, chRes] = await Promise.all([
            api.get(`/viewer/datasets/${params.id}`),
            api.get(`/viewer/datasets/${params.id}/preview`),
            api.get(`/viewer/datasets/${params.id}/schema`),
            api.get(`/viewer/datasets/${params.id}/insights`),
            api.get(`/viewer/datasets/${params.id}/charts`)
          ])
          
          setDataset(dsRes.data)
          setPreview(prevRes.data)
          setSchema(schRes.data)
          setInsights(insRes.data)
          setCharts(chRes.data)
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
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[70vh]">
        <Database className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Dataset Not Found</h2>
        <p className="text-slate-500 mb-6 mt-2">You might not have permission to view this dataset.</p>
        <Button onClick={() => router.push('/viewer/dashboard/datasets')}>Return to Datasets</Button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-4">
          <Link href="/viewer/dashboard/datasets">
            <Button variant="ghost" size="sm" className="pl-0 text-slate-500 hover:text-slate-900 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explorer
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {dataset.name}
                </h1>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verified
                </Badge>
              </div>
              <p className="text-slate-500 max-w-2xl mt-1">
                {dataset.description || "Enterprise dataset available for read-only analytical exploration."}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <BrainCircuit className="w-4 h-4" />
            Ask AI Copilot
          </Button>
        </div>
      </div>

      {/* QUICK METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><TableIcon className="w-4 h-4" /> Total Rows</span>
          <span className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{dataset.row_count?.toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><FileDigit className="w-4 h-4" /> Columns</span>
          <span className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{dataset.column_count}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Info className="w-4 h-4" /> Department</span>
          <span className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{dataset.department}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Last Updated</span>
          <span className="text-xl font-bold mt-1 text-slate-900 dark:text-white">{new Date(dataset.updated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* EXPLORER TABS */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-auto p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          <TabsTrigger value="preview" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Eye className="w-4 h-4 mr-2" /> Preview
          </TabsTrigger>
          <TabsTrigger value="schema" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TableIcon className="w-4 h-4 mr-2" /> Schema
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-500" /> Insights
          </TabsTrigger>
          <TabsTrigger value="charts" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <PieChart className="w-4 h-4 mr-2 text-rose-500" /> Charts
          </TabsTrigger>
        </TabsList>
        
        {/* TAB: PREVIEW */}
        <TabsContent value="preview" className="mt-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-lg flex items-center text-slate-800 dark:text-slate-200">
                Data Preview
              </h3>
              <Badge variant="outline" className="text-slate-500 font-normal">
                Showing {preview?.preview_count || 0} sample rows
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-950/50 whitespace-nowrap">
                  <TableRow className="hover:bg-transparent">
                    {preview?.columns?.map((col: any) => (
                      <TableHead key={col.name} className="min-w-[120px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{col.name}</span>
                          <span className="text-[10px] uppercase text-slate-400 font-mono tracking-wider">{col.type}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview?.rows?.length > 0 ? (
                    preview.rows.map((row: any, i: number) => (
                      <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {preview.columns.map((col: any) => (
                          <TableCell key={col.name} className="whitespace-nowrap font-mono text-sm text-slate-600 dark:text-slate-400">
                            {row[col.name]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={preview?.columns?.length || 1} className="h-48 text-center text-slate-500">
                        No preview data available for this dataset.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* TAB: SCHEMA */}
        <TabsContent value="schema" className="mt-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Schema Explorer</h3>
            </div>
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">Column Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Constraints</TableHead>
                  <TableHead>Sample Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schema?.length > 0 ? (
                  schema.map((col: any, i: number) => (
                    <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium font-mono text-sm">{col.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 font-mono text-xs">
                          {col.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {col.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {col.nullable && <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">NULL</Badge>}
                          {col.unique && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600">UNIQUE</Badge>}
                          {!col.nullable && !col.unique && <span className="text-xs text-slate-400">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 truncate max-w-[150px]">
                        {col.sample?.length ? col.sample[0] : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                      Schema information is not available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB: INSIGHTS */}
        <TabsContent value="insights" className="mt-6 space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-purple-50 dark:from-emerald-950/40 dark:to-purple-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-100 flex items-center mb-4">
                <BrainCircuit className="w-6 h-6 mr-3 text-emerald-600 dark:text-emerald-400" />
                AI Executive Summary
              </h3>
              <p className="text-emerald-900/80 dark:text-emerald-200/80 text-lg leading-relaxed">
                {insights?.executive_summary || "Generating summary based on recent data patterns..."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-slate-900 dark:text-white flex items-center mb-4">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> Key Observations
              </h4>
              <ul className="space-y-3">
                {insights?.kpis?.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-3 flex-shrink-0" />
                    {kpi}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
              <h4 className="font-semibold text-slate-900 dark:text-white flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> Detected Anomalies
              </h4>
              <ul className="space-y-3">
                {insights?.anomalies?.map((anom: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-3 flex-shrink-0" />
                    {anom}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm md:col-span-2 lg:col-span-1">
              <h4 className="font-semibold text-slate-900 dark:text-white flex items-center mb-4">
                <Zap className="w-5 h-5 mr-2 text-emerald-500" /> Opportunities
              </h4>
              <ul className="space-y-3">
                {insights?.opportunities?.map((opp: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-3 flex-shrink-0" />
                    {opp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* TAB: CHARTS */}
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {charts?.length > 0 ? (
              charts.map((chart: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col items-center justify-center">
                  {/* Since viewer is read-only, we just render an abstract view of the chart for the demo. In a real app we'd use Recharts here based on `chart` config. */}
                  <div className="w-full flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                    <h3 className="font-semibold text-slate-800 flex items-center">
                      {chart.type === 'pie' ? <PieChart className="w-5 h-5 mr-2 text-rose-500" /> : <LineChart className="w-5 h-5 mr-2 text-emerald-500" />}
                      {chart.title}
                    </h3>
                    <Badge variant="outline">{chart.type.toUpperCase()}</Badge>
                  </div>
                  
                  {chart.type === 'kpi' ? (
                     <div className="text-center">
                        <div className="text-4xl font-bold text-slate-900">{chart.metrics?.value?.toLocaleString() || 0}</div>
                        <div className="text-sm text-slate-500 mt-2">Median: {chart.metrics?.median || 0}</div>
                     </div>
                  ) : (
                    <div className="w-full flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        {chart.type === 'bar' ? (
                          <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey={chart.x_axis_key || "name"} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey={chart.y_axis_key || "value"} fill="#34d399" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        ) : chart.type === 'line' ? (
                          <RechartsLineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey={chart.x_axis_key || "name"} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Line type="monotone" dataKey={chart.y_axis_key || "value"} stroke="#34d399" strokeWidth={3} dot={{r: 4, fill: '#34d399', strokeWidth: 0}} activeDot={{r: 6}} />
                          </RechartsLineChart>
                        ) : (
                          <RechartsPieChart>
                            <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#fb7185" label={false}>
                              {chart.data?.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={['#fb7185', '#f43f5e', '#e11d48', '#fda4af', '#be123c'][index % 5]} />
                              ))}
                            </Pie>
                          </RechartsPieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 shadow-sm">
                <PieChart className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-900 dark:text-white">No Visualizations Available</p>
                <p className="text-sm">Charts will appear once the dataset is fully profiled.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
