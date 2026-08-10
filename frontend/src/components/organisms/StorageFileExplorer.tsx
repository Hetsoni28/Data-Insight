import { useState, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { storageService } from "@/lib/storageService"
import { FileText, FileSpreadsheet, Image as ImageIcon, Database, Archive, File, Download, Trash2, ExternalLink, ShieldAlert, Loader2 } from "lucide-react"
import { PaginationControls } from "@/components/molecules/PaginationControls"

interface StorageFile {
  id: string
  file_name: string
  file_type: string
  category: string
  size_bytes: number
  is_public: boolean
  bucket_name: string
  tenant_name: string
  created_at: string
}

interface StorageFileExplorerProps {
  files?: StorageFile[]
  activeFilter?: string
  searchQuery?: string
  onClearSearch?: () => void
}

// Map filter names to file categories
const FILTER_MAP: Record<string, string[]> = {
  "All Files":    [],
  "Datasets":     ["data", "spreadsheet"],
  "Reports":      ["document"],
  "AI Generated": ["ai", "generated"],
  "Archives":     ["archive"],
  "Images":       ["image"],
}

export function StorageFileExplorer({ 
  files = [], 
  activeFilter = "All Files",
  searchQuery = "",
  onClearSearch,
}: StorageFileExplorerProps) {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (file: StorageFile) => {
    try {
      setDownloadingId(file.id)
      toast.info(`Downloading ${file.file_name}...`)

      const response = await storageService.downloadFile(file.id)
      
      const contentType = (response.headers['content-type'] as string | undefined) || file.file_type || 'application/octet-stream'
      const blob = new Blob([response.data], {
        type: contentType,
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Downloaded ${file.file_name}`)
      queryClient.invalidateQueries({ queryKey: ['owner-storage'] })
    } catch (err) {
      console.error("Download failed", err)
      toast.error(`Failed to download ${file.file_name}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const filteredFiles = useMemo(() => {
    const cats = FILTER_MAP[activeFilter] ?? []
    if (cats.length === 0) return files
    return files.filter(f => cats.includes(f.category))
  }, [files, activeFilter])

  const deleteMutation = useMutation({
    mutationFn: storageService.deleteFile,
    onMutate: (id) => {
      setDeletingId(id)
    },
    onSuccess: () => {
      toast.success("File deleted successfully")
      queryClient.invalidateQueries({ queryKey: ['owner-storage'] })
    },
    onError: () => {
      toast.error("Failed to delete file")
    },
    onSettled: () => {
      setDeletingId(null)
    }
  })

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      deleteMutation.mutate(id)
    }
  }

  const totalItems = filteredFiles.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedFiles = useMemo(() =>
    filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredFiles, currentPage, pageSize]
  )

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (category: string) => {
    switch(category) {
      case 'document': return <FileText className="h-5 w-5 text-emerald-500" />
      case 'spreadsheet': return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
      case 'image': return <ImageIcon className="h-5 w-5 text-teal-500" />
      case 'data': return <Database className="h-5 w-5 text-amber-500" />
      case 'archive': return <Archive className="h-5 w-5 text-orange-500" />
      default: return <File className="h-5 w-5 text-slate-500" />
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="bg-white/80 dark:bg-[#0c131d]/90 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">File Explorer</h2>
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Matching &quot;{searchQuery}&quot;
                {onClearSearch && (
                  <button onClick={onClearSearch} className="hover:text-emerald-700 dark:hover:text-white ml-0.5 cursor-pointer">
                    &times;
                  </button>
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} {activeFilter !== 'All Files' ? `in ${activeFilter}` : 'in storage'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}
          >
            Grid View
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}
          >
            List View
          </button>
        </div>
      </div>

      <div className={viewMode === 'list' ? "overflow-x-auto" : "p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
        {viewMode === 'list' ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-xs font-medium text-slate-500 dark:text-slate-400">
              <th className="p-4 font-medium pl-6">Name</th>
              <th className="p-4 font-medium">Bucket</th>
              <th className="p-4 font-medium">Organization</th>
              <th className="p-4 font-medium">Size</th>
              <th className="p-4 font-medium">Visibility</th>
              <th className="p-4 font-medium">Uploaded</th>
              <th className="p-4 font-medium text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
            {paginatedFiles.map(file => (
              <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10">
                      {getFileIcon(file.category)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white max-w-[200px] truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="text-xs text-slate-500 uppercase">{file.file_type.split('/').pop()}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-300">{file.bucket_name}</td>
                <td className="p-4 text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={file.tenant_name || 'System'}>
                  {file.tenant_name || 'System'}
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                  {formatBytes(file.size_bytes)}
                </td>
                <td className="p-4">
                  {file.is_public ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                      Private
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {formatDate(file.created_at)}
                </td>
                <td className="p-4 pr-6">
                  <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer" 
                      title="Download"
                    >
                      {downloadingId === file.id ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : <Download className="h-4 w-4" />}
                    </button>
                    <button 
                      onClick={() => setSelectedFile(file)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer" 
                      title="View Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer" 
                      title="Delete"
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                    >
                      {deletingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredFiles.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="h-10 w-10 opacity-30 text-emerald-500" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {searchQuery 
                        ? `No files found matching "${searchQuery}"`
                        : activeFilter !== "All Files"
                        ? `No files found in "${activeFilter}"`
                        : "No files in storage yet"}
                    </p>
                    {searchQuery && onClearSearch && (
                      <button 
                        onClick={onClearSearch}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        ) : (
          <>
            {paginatedFiles.map(file => (
              <div key={file.id} className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 rounded-xl p-4 flex flex-col gap-3 group relative">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-white dark:bg-white/10 shadow-sm border border-slate-100 dark:border-white/10">
                    {getFileIcon(file.category)}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 bg-white dark:bg-white/10 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-colors cursor-pointer"
                      title="Download"
                    >
                      {downloadingId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" /> : <Download className="h-3.5 w-3.5" />}
                    </button>
                    <button 
                      onClick={() => setSelectedFile(file)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 bg-white dark:bg-white/5 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white truncate" title={file.file_name}>{file.file_name}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatBytes(file.size_bytes)} • {formatDate(file.created_at)}</p>
                </div>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="h-10 w-10 opacity-30 text-emerald-500" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {searchQuery 
                    ? `No files found matching "${searchQuery}"`
                    : activeFilter !== "All Files"
                    ? `No files found in "${activeFilter}"`
                    : "No files in storage yet"}
                </p>
                {searchQuery && onClearSearch && (
                  <button 
                    onClick={onClearSearch}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedFile(null)}>
          <div className="bg-white dark:bg-[#0B0F17]/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full m-4 shadow-2xl border border-slate-200/60 dark:border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 dark:text-white">File Details</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Name</span>
                <span className="col-span-2 font-medium dark:text-white truncate" title={selectedFile.file_name}>{selectedFile.file_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Size</span>
                <span className="col-span-2 dark:text-white">{formatBytes(selectedFile.size_bytes)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Type</span>
                <span className="col-span-2 dark:text-white">{selectedFile.file_type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="col-span-2 dark:text-white capitalize">{selectedFile.category}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="col-span-2 dark:text-white">{formatDate(selectedFile.created_at)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Bucket</span>
                <span className="col-span-2 dark:text-white font-mono text-xs">{selectedFile.bucket_name || 'datasets'}</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button 
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => handleDownload(selectedFile)}
                disabled={downloadingId === selectedFile.id}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {downloadingId === selectedFile.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  )
}
