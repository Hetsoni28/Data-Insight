import { ReactNode } from "react"
import { motion } from "framer-motion"
import { Brain, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface CommandCenterMessageProps {
  role: "user" | "assistant"
  content: ReactNode
  isStreaming?: boolean
}

export function CommandCenterMessage({ role, content, isStreaming }: CommandCenterMessageProps) {
  const isAssistant = role === "assistant"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 w-full ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mt-1">
          <Brain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
          isAssistant
            ? "bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-sm"
            : "bg-emerald-600 text-white shadow-md"
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {typeof content === 'string' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          ) : (
            content
          )}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-block w-2 h-4 bg-emerald-500 ml-1 translate-y-1"
            />
          )}
        </div>
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
      )}
    </motion.div>
  )
}
