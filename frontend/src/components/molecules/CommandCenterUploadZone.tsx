import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, FileType, X } from "lucide-react"

interface CommandCenterUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  selectedFiles: File[]
  onRemoveFile: (index: number) => void
}

export function CommandCenterUploadZone({ onFilesSelected, selectedFiles, onRemoveFile }: CommandCenterUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  })

  return (
    <div className="w-full mb-3 flex flex-col gap-2">
      {selectedFiles.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selectedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <FileType className="w-3 h-3 text-emerald-500" />
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button onClick={() => onRemoveFile(i)} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors ml-1">
                <X className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div 
        {...getRootProps()} 
        className={`w-full flex items-center justify-center p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isDragActive 
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400" 
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-white/5 text-slate-500"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isDragActive ? "Drop files here" : "Drag & drop files or click to upload (CSV, Excel, PDF, Images)"}
          </span>
        </div>
      </div>
    </div>
  )
}
