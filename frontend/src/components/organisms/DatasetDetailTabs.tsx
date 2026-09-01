"use client"

import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Eye, Table as TableIcon, Sparkles, PieChart, TrendingUp, AlertTriangle, Zap, LineChart, ArrowRightLeft } from "lucide-react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DatasetComparisonView } from "./DatasetComparisonView"
import { PaginationControls } from "@/components/molecules/PaginationControls"
import { useState } from "react"

interface DatasetDetailTabsProps {
  preview: any
  schema: any[]
  insights: any
  charts: any[]
}

export function DatasetDetailTabs({
  preview,
  schema,
  insights,
  charts,
  activeTab = "preview",
  onTabChange,
}: DatasetDetailTabsProps & { activeTab?: string; onTabChange?: (tab: string) => void }) {
  const params = useParams()
  const datasetId = params?.id as string
  const { data: user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [previewPage, setPreviewPage] = useState(1)
  const PAGE_SIZE = 10
  const allRows = preview?.rows || []
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE))
  const pagedRows = allRows.slice((previewPage - 1) * PAGE_SIZE, previewPage * PAGE_SIZE)
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className={`grid w-full grid-cols-2 h-auto p-1.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/10 rounded-2xl shadow-sm mb-8 ${!isViewer ? 'md:grid-cols-5 lg:w-[850px]' : 'md:grid-cols-4 lg:w-[700px]'}`}>
          <TabsTrigger value="preview" className="rounded-xl py-3 font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all">
            <Eye className="w-4 h-4 mr-2" /> Data Preview
          </TabsTrigger>
          <TabsTrigger value="schema" className="rounded-xl py-3 font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all">
            <TableIcon className="w-4 h-4 mr-2" /> Schema
          </TabsTrigger>
          <TabsTrigger value="insights" className="rounded-xl py-3 font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-500" /> AI Insights
          </TabsTrigger>
          <TabsTrigger value="charts" className="rounded-xl py-3 font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all">
            <PieChart className="w-4 h-4 mr-2 text-rose-500" /> Visualizations
          </TabsTrigger>
          {!isViewer && (
            <TabsTrigger value="compare" className="rounded-xl py-3 font-bold text-slate-600 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all">
              <ArrowRightLeft className="w-4 h-4 mr-2" /> Compare
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* TAB: PREVIEW */}
        <TabsContent value="preview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-3xl shadow-xl shadow-emerald-500/5 overflow-hidden flex flex-col min-h-[500px] relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-50" />
            <div className="px-8 py-6 border-b border-emerald-500/10 flex justify-between items-center bg-white/40 dark:bg-slate-900/40">
              <h3 className="font-extrabold text-xl flex items-center text-slate-900 dark:text-white">
                Data Preview
              </h3>
              <Badge variant="outline" className="text-slate-600 dark:text-slate-300 font-bold bg-white dark:bg-slate-950 border-emerald-500/20 px-3 py-1.5 rounded-xl shadow-sm">
                {allRows.length} rows &nbsp;·&nbsp; Page {previewPage} of {totalPages}
              </Badge>
            </div>
            <div className="overflow-x-auto flex-1 p-2">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 backdrop-blur-xl z-10">
                  <TableRow className="hover:bg-transparent border-emerald-500/10">
                    {preview?.columns?.map((col: any) => (
                      <TableHead key={col.name} className="min-w-[140px] px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{col.name}</span>
                          <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-mono font-bold tracking-wider">{col.type}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.length > 0 ? (
                    pagedRows.map((row: any, i: number) => (
                      <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-emerald-500/5 last:border-0">
                        {preview.columns.map((col: any) => (
                          <TableCell key={col.name} className="whitespace-nowrap font-mono text-sm font-medium text-slate-600 dark:text-slate-300 px-6 py-4">
                            {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : <span className="text-slate-300 dark:text-slate-600">NULL</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={preview?.columns?.length || 1} className="h-64 text-center border-0">
                         <div className="flex flex-col items-center justify-center text-slate-500">
                          <TableIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-4" />
                          <p className="text-lg font-bold text-slate-900 dark:text-white">No preview data</p>
                          <p className="text-sm mt-1">Preview data is not available for this dataset.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="px-8 py-5 border-t border-emerald-500/10 bg-white/40 dark:bg-slate-900/40 flex justify-center">
                <PaginationControls
                  currentPage={previewPage}
                  totalPages={totalPages}
                  totalItems={allRows.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPreviewPage}
                  onPageSizeChange={() => {}}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: SCHEMA */}
        <TabsContent value="schema" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-3xl shadow-xl shadow-emerald-500/5 overflow-hidden flex flex-col min-h-[500px] relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-50" />
            <div className="px-8 py-6 border-b border-emerald-500/10 flex justify-between items-center bg-white/40 dark:bg-slate-900/40">
              <h3 className="font-extrabold text-xl flex items-center text-slate-900 dark:text-white">
                Schema Explorer
              </h3>
            </div>
            <div className="overflow-x-auto flex-1 p-2">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 backdrop-blur-xl z-10">
                  <TableRow className="hover:bg-transparent border-emerald-500/10">
                    <TableHead className="w-[250px] font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4 pl-6">Column Name</TableHead>
                    <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Type</TableHead>
                    <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Description</TableHead>
                    <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Constraints</TableHead>
                    <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4 pr-6">Sample Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schema?.length > 0 ? (
                    schema.map((col: any, i: number) => (
                      <TableRow key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-emerald-500/5 last:border-0">
                        <TableCell className="font-bold font-mono text-[13px] text-slate-900 dark:text-white pl-6 py-4">{col.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold px-2 py-1">
                            {col.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-300 font-medium max-w-xs truncate py-4">
                          {col.description || <span className="text-slate-400 italic">No description</span>}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex gap-2">
                            {col.nullable && <Badge variant="secondary" className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">NULL</Badge>}
                            {col.unique && <Badge variant="secondary" className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">UNIQUE</Badge>}
                            {!col.nullable && !col.unique && <span className="text-xs text-slate-300 dark:text-slate-600">-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px] pr-6 py-4">
                          {col.sample?.length ? String(col.sample[0]) : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center border-0">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <TableIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-4" />
                          <p className="text-lg font-bold text-slate-900 dark:text-white">No schema data</p>
                          <p className="text-sm mt-1">Schema structure is not available for this dataset.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* TAB: INSIGHTS */}
        <TabsContent value="insights" className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-6">
          <div className="bg-gradient-to-br from-[#0f4b36] to-[#1e3a8a] rounded-3xl p-10 relative overflow-hidden shadow-2xl shadow-emerald-900/10 border border-emerald-500/20">
            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
              <Sparkles className="w-48 h-48 text-emerald-300 mix-blend-overlay" />
            </div>
            <div className="relative z-10 max-w-4xl">
              <Badge variant="outline" className="mb-4 bg-white/10 text-emerald-100 border-white/20 backdrop-blur-md px-3 py-1 font-bold rounded-xl">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Executive Summary
              </Badge>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">
                Dataset Intelligence Report
              </h3>
              <p className="text-emerald-50 md:text-xl font-medium leading-relaxed drop-shadow-sm">
                {insights?.executive_summary || "Our AI is analyzing this dataset to uncover hidden patterns, trends, and anomalies. Check back shortly for a comprehensive executive summary."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
              <h4 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center mb-6 relative z-10">
                <TrendingUp className="w-6 h-6 mr-3 text-emerald-500" /> Key Observations
              </h4>
              <ul className="space-y-4 relative z-10">
                {insights?.kpis?.length > 0 ? insights.kpis.map((kpi: string, i: number) => (
                  <li key={i} className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-4 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {kpi}
                  </li>
                )) : (
                  <li className="text-slate-500 italic">No key observations generated yet.</li>
                )}
              </ul>
            </div>
            
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-colors" />
              <h4 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center mb-6 relative z-10">
                <AlertTriangle className="w-6 h-6 mr-3 text-rose-500" /> Detected Anomalies
              </h4>
              <ul className="space-y-4 relative z-10">
                {insights?.anomalies?.length > 0 ? insights.anomalies.map((anom: string, i: number) => (
                  <li key={i} className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 mr-4 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    {anom}
                  </li>
                )) : (
                   <li className="text-slate-500 italic">No anomalies detected in this dataset.</li>
                )}
              </ul>
            </div>
            
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none md:col-span-2 lg:col-span-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
              <h4 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center mb-6 relative z-10">
                <Zap className="w-6 h-6 mr-3 text-blue-500" /> Opportunities
              </h4>
              <ul className="space-y-4 relative z-10">
                {insights?.opportunities?.length > 0 ? insights.opportunities.map((opp: string, i: number) => (
                  <li key={i} className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-4 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    {opp}
                  </li>
                )) : (
                  <li className="text-slate-500 italic">No specific opportunities identified yet.</li>
                )}
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* TAB: CHARTS */}
        <TabsContent value="charts" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {charts?.length > 0 ? (
              charts.map((chart: any, idx: number) => (
                <div key={idx} className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[400px] flex flex-col items-center justify-center relative group overflow-hidden">
                  <div className="w-full flex justify-between items-center mb-10 border-b border-emerald-500/10 pb-5 z-10">
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center">
                      {chart.type === 'pie' ? <PieChart className="w-6 h-6 mr-3 text-rose-500" /> : <LineChart className="w-6 h-6 mr-3 text-emerald-500" />}
                      {chart.title}
                    </h3>
                    <Badge variant="outline" className="bg-white dark:bg-slate-950 font-bold border-emerald-500/30 px-3 py-1 rounded-xl shadow-sm">
                      {chart.type.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {chart.type === 'kpi' ? (
                     <div className="text-center z-10">
                        <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-blue-600 drop-shadow-sm">{chart.metrics?.value?.toLocaleString() || 0}</div>
                        <div className="text-lg font-bold text-slate-500 mt-4 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full inline-block">Median: {chart.metrics?.median || 0}</div>
                     </div>
                  ) : (
                    <div className="w-full flex-1 min-h-[250px] z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        {chart.type === 'bar' ? (
                          <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey={chart.x_axis_key || "name"} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} />
                            <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} />
                            <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                            <Bar dataKey={chart.y_axis_key || "value"} fill="#10b981" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        ) : chart.type === 'line' ? (
                          <RechartsLineChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey={chart.x_axis_key || "name"} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} />
                            <YAxis tickLine={false} axisLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} />
                            <RechartsTooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                            <Line type="monotone" dataKey={chart.y_axis_key || "value"} stroke="#10b981" strokeWidth={4} dot={{r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} />
                          </RechartsLineChart>
                        ) : (
                          <RechartsPieChart>
                            <RechartsTooltip contentStyle={{borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={70} paddingAngle={5}>
                              {chart.data?.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6'][index % 5]} stroke="transparent" />
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
              <div className="col-span-full h-96 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center text-slate-500 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-white/10">
                  <PieChart className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">No Visualizations Available</p>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Charts will appear automatically once the dataset is fully profiled.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {!isViewer && (
          <TabsContent value="compare" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
            <DatasetComparisonView baseDatasetId={datasetId} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  )
}
