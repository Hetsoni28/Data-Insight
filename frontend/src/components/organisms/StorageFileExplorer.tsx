import { useState, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { storageService } from "@/lib/storageService"
import { FileText, FileSpreadsheet, Image as ImageIcon, Database, FileCode, Archive, File, Download, Trash2, ExternalLink, ShieldAlert, Loader2 } from "lucide-react"
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
}

export function StorageFileExplorer({ files = [], activeFilter = "All Files" }: StorageFileExplorerProps) {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null)

  // Map filter names to file categories
  const FILTER_MAP: Record<string, string[]> = {
    "All Files":    [],
    "Datasets":     ["data", "spreadsheet"],
    "Reports":      ["document"],
    "AI Generated": ["ai", "generated"],
    "Archives":     ["archive"],
    "Images":       ["image"],
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
    switch (category) {
      case 'document': return <FileText className="h-5 w-5 text-blue-500" />
      case 'spreadsheet': return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
      case 'image': return <ImageIcon className="h-5 w-5 text-purple-500" />
      case 'data': return <Database className="h-5 w-5 text-rose-500" />
      case 'archive': return <Archive className="h-5 w-5 text-amber-500" />
      default: return <File className="h-5 w-5 text-slate-500" />
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
        <h3 className="font-semibold text-slate-800 dark:text-white">File Explorer</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
          >
            Grid View
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
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
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5">
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
                      onClick={() => window.open((file as any).url || (file as any).path || `/api/owner/storage/files/${file.id}/download`, '_blank')}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedFile(file)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50" 
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

            {files.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldAlert className="h-10 w-10 mb-3 opacity-20" />
                    <p>No files found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        ) : (
          <>
            {paginatedFiles.map(file => (
              <div key={file.id} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col gap-3 group relative">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5">
                    {getFileIcon(file.category)}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => window.open((file as any).url || (file as any).path || `/api/owner/storage/files/${file.id}/download`, '_blank')}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => setSelectedFile(file)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
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
            {files.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                <ShieldAlert className="h-10 w-10 mb-3 opacity-20" />
                <p>No files found.</p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedFile(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full m-4 shadow-xl border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 dark:text-white">File Details</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Name</span>
                <span className="col-span-2 font-medium dark:text-white truncate" title={selectedFile.file_name}>{selectedFile.file_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Size</span>
                <span className="col-span-2 dark:text-white">{formatBytes(selectedFile.size_bytes)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Type</span>
                <span className="col-span-2 dark:text-white">{selectedFile.file_type}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="col-span-2 dark:text-white">{formatDate(selectedFile.created_at)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Path/URL</span>
                <span className="col-span-2 dark:text-white truncate" title={(selectedFile as any).url || (selectedFile as any).path}>{(selectedFile as any).url || (selectedFile as any).path || '-'}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Close
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
