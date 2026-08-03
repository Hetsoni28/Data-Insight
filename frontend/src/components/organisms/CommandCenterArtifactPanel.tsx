import { motion } from "framer-motion"
import { Code, FileSpreadsheet, LineChart, X } from "lucide-react"
import { ReactNode } from "react"

export type ArtifactType = "report" | "sql" | "chart"

interface CommandCenterArtifactPanelProps {
  isOpen: boolean
  onClose: () => void
  type: ArtifactType | null
  title: string
  content: ReactNode
}

export function CommandCenterArtifactPanel({ isOpen, onClose, type, title, content }: CommandCenterArtifactPanelProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case "report": return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
      case "sql": return <Code className="w-5 h-5 text-blue-500" />
      case "chart": return <LineChart className="w-5 h-5 text-purple-500" />
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 bottom-4 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          {getIcon()}
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-4">{title}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {content}
      </div>
    </motion.div>
  )
}
