"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Database, SearchX, Clock, ChevronRight, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/molecules/PaginationControls"
import Link from "next/link"

interface DatasetTableProps {
  loading: boolean
  search: string
  setSearch: (val: string) => void
  paginatedDatasets: any[]
  filteredCount: number
  currentPage: number
  totalPages: number
  pageSize: number
  setCurrentPage: (val: number) => void
  setPageSize: (val: number) => void
}

export function DatasetTable({
  loading,
  search,
  setSearch,
  paginatedDatasets,
  filteredCount,
  currentPage,
  totalPages,
  pageSize,
  setCurrentPage,
  setPageSize
}: DatasetTableProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-3xl shadow-xl shadow-emerald-500/5 overflow-hidden flex flex-col min-h-[600px] relative"
    >
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-50" />
      
      {/* Header & Controls */}
      <div className="p-6 border-b border-emerald-500/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white/40 dark:bg-slate-900/40">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-emerald-500" />
            Dataset Catalog
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
            Browse and explore available datasets in this workspace
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Search datasets by name or department..." 
              className="pl-10 h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-white/10 rounded-xl focus-visible:ring-emerald-500 shadow-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto h-11 gap-2 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-sm border-slate-200 dark:border-white/10 hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Filters
          </Button>
        </div>
      </div>
      
      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 backdrop-blur-xl z-10">
            <TableRow className="hover:bg-transparent border-emerald-500/10">
              <TableHead className="w-[320px] font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4 pl-6">Dataset Name</TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Department</TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Owner</TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Rows / Cols</TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4 w-[140px]">Quality</TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4">Last Updated</TableHead>
              <TableHead className="text-right font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wider py-4 pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-emerald-500/5">
                  <TableCell className="pl-6"><Skeleton className="h-6 w-[240px] rounded-md bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[120px] rounded-md bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[140px] rounded-md bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[90px] rounded-md bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-md bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[110px] rounded-md bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-9 w-28 ml-auto rounded-xl bg-slate-200/50 dark:bg-slate-800/50" /></TableCell>
                </TableRow>
              ))
            ) : paginatedDatasets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-96 text-center border-0">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-slate-500"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-slate-200 dark:border-white/10">
                      <SearchX className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">No datasets found</p>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">
                      {search ? `We couldn't find any results for "${search}".` : "There are no shared datasets available right now."}
                    </p>
                  </motion.div>
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
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-emerald-500/5 last:border-0"
                  >
                    <TableCell className="font-medium py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-slate-900 dark:text-white font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-[15px]">
                            {ds.name}
                          </div>
                          <div className="text-xs text-slate-500 font-medium truncate max-w-[240px] mt-0.5">
                            {ds.description || "No description provided"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-2.5 py-1">
                        {ds.department || "Business Analytics"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const ownerName = typeof ds.owner === "string" ? ds.owner : ds.owner?.name || "Unknown";
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm">
                              {ownerName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{ownerName}</span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 text-sm font-bold">
                      {ds.row_count?.toLocaleString() || 0} <span className="text-slate-400 font-medium">/</span> {ds.column_count || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${ds.data_quality_score > 80 ? 'bg-emerald-500' : ds.data_quality_score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${ds.data_quality_score || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ds.data_quality_score || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(ds.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/viewer/dashboard/datasets/${ds.id}`}>
                        <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 px-4 rounded-xl shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95">
                          Explore
                          <ChevronRight className="w-4 h-4 ml-1.5" />
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
      
      {/* Pagination Footer */}
      {!loading && (
        <div className="p-5 border-t border-emerald-500/10 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
          />
        </div>
      )}
    </motion.div>
  )
}
