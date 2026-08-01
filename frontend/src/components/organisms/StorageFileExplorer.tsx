import { FileText, FileSpreadsheet, Image as ImageIcon, Database, FileCode, Archive, File, Download, Trash2, ExternalLink, ShieldAlert } from "lucide-react"

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
}

export function StorageFileExplorer({ files = [] }: StorageFileExplorerProps) {
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
          <button className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
            Grid View
          </button>
          <button className="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors">
            List View
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {files.map(file => (
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
                    <button className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors" title="Download">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="View details">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  )
}
