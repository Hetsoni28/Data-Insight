"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { useWorkspaceStore } from "@/store/workspaceStore"
import {
  Database,
  Search,
  Filter,
  Download,
  Star,
  Activity,
  LineChart,
  BrainCircuit,
  Eye,
  Calendar,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MetricCard } from "@/components/molecules/MetricCard"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/molecules/PaginationControls"

export default function ViewerDatasetExplorer() {
  const { data: user } = useAuth()
  const { activeWs } = useWorkspaceStore()
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  useEffect(() => {
    if (activeWs?.id) {
      setLoading(true)
      api.get(`/viewer/datasets?workspace_id=${activeWs.id}`)
        .then((res) => setDatasets(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [activeWs?.id])

  const filteredDatasets = datasets.filter((ds) =>
    ds.name.toLowerCase().includes(search.toLowerCase()) ||
    ds.department?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const paginatedDatasets = filteredDatasets.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredDatasets.length / pageSize)

  const avgQuality = datasets.length ? datasets.reduce((acc, curr) => acc + (curr.data_quality_score || 0), 0) / datasets.length : 0

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto h-full overflow-y-auto">
      {/* WELCOME BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-emerald-50 border-none px-3 py-1 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Enterprise Viewer
              </Badge>
              <span className="text-emerald-200 text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-white">
                Dataset Center
              </h1>
              <p className="text-emerald-200 max-w-xl text-lg leading-relaxed">
                Welcome back, {user?.full_name}. Securely explore, analyze, and query {datasets.length} shared enterprise datasets in {activeWs?.name}.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button variant="secondary" className="bg-white text-emerald-950 hover:bg-emerald-50 shadow-lg">
              <BrainCircuit className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
            <Button variant="outline" className="border-emerald-400 text-emerald-50 hover:bg-emerald-800/50 backdrop-blur-md">
              <LineChart className="w-4 h-4 mr-2" />
              Dashboards
            </Button>
          </div>
        </div>
      </motion.div>

      {/* EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Shared Datasets"
          value={loading ? "-" : datasets.length.toString()}
          icon={<Database className="w-4 h-4 text-blue-500" />}
          trend={2}
          trendLabel="vs last week"
        />
        <MetricCard
          title="Data Quality Score"
          value={loading ? "-" : Math.round(avgQuality).toString()}
          icon={<Activity className="w-4 h-4 text-emerald-500" />}
          trend={5}
          trendLabel="vs last month"
        />
        <MetricCard
          title="Favorite Datasets"
          value={loading ? "-" : "3"} // Static for viewer demo logic, would come from real API ideally
          icon={<Star className="w-4 h-4 text-amber-500" />}
        />
        <MetricCard
          title="Recent Downloads"
          value={loading ? "-" : "12"}
          icon={<Download className="w-4 h-4 text-purple-500" />}
          trend={-2}
          trendLabel="vs last month"
        />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search datasets by name or department..." 
            className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="w-full md:w-auto gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* SHARED DATASET EXPLORER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
          <h2 className="font-semibold text-lg flex items-center">
            <Database className="w-5 h-5 mr-2 text-emerald-500" />
            Enterprise Data Catalog
          </h2>
          <Badge variant="secondary" className="font-normal text-slate-500">Read-Only Access</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-950/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Dataset Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Rows / Cols</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDatasets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Database className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
                      <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No datasets found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {paginatedDatasets.map((ds, idx) => (
                    <motion.tr
                      key={ds.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {ds.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[200px]">
                              {ds.description || "No description provided"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {ds.department || "Business Analytics"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-medium">
                            {ds.owner?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{ds.owner}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        {ds.row_count?.toLocaleString() || 0} / {ds.column_count || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${ds.data_quality_score > 80 ? 'bg-emerald-500' : ds.data_quality_score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${ds.data_quality_score || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{ds.data_quality_score || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(ds.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/viewer/dashboard/datasets/${ds.id}`}>
                          <Button variant="ghost" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                            Explore
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
        
        {!loading && totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDatasets.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        )}
      </div>
    </div>
  )
}
