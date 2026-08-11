"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { managerDatasetsService } from "@/lib/manager-datasets.service"
import { useWorkspaceStore } from "@/store/workspaceStore"

import { ManagerDatasetsHeader } from "@/components/organisms/ManagerDatasetsHeader"
import { ManagerDatasetsToolbar } from "@/components/organisms/ManagerDatasetsToolbar"
import { ManagerDatasetsTable } from "@/components/organisms/ManagerDatasetsTable"

export default function ManagerDatasetsPage() {
  const router = useRouter()
  
  const [summary, setSummary] = useState<any>(null)
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const limit = 25

  const fetchSummary = async () => {
    try {
      const res = await managerDatasetsService.getSummary()
      setSummary(res.data)
    } catch (e) {
      console.error("Failed to fetch summary", e)
    }
  }

  const fetchDatasets = useCallback(async () => {
    setLoading(true)
    try {
      const skip = (page - 1) * limit
      const res = await managerDatasetsService.getDatasets({
        search: searchTerm,
        status: statusFilter,
        skip,
        limit
      })
      
      setDatasets(res.data.datasets || [])
      setTotalPages(res.data.pages || 1)
    } catch (e) {
      console.error("Failed to fetch datasets", e)
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      try {
        await managerDatasetsService.deleteDataset(id)
        await fetchSummary()
        await fetchDatasets()
      } catch (e) {
        alert("Failed to delete dataset. You may not have permission.")
      }
    }
  }

  const handleUpload = () => {
    useWorkspaceStore.getState().setIsUploadOpen(true)
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-[#09090b] min-h-screen pb-24">
      <div className="max-w-[1800px] mx-auto">
        <ManagerDatasetsHeader summary={summary} />
        
        <ManagerDatasetsToolbar 
          onSearch={handleSearch} 
          statusFilter={statusFilter} 
          onStatusFilter={handleStatusFilter} 
          onUpload={handleUpload}
        />
        
        <ManagerDatasetsTable 
          datasets={datasets}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
