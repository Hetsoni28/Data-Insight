import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Paperclip, FileType, X, Brain } from "lucide-react"
import { CommandCenterMessage } from "@/components/molecules/CommandCenterMessage"
import { CommandCenterArtifactPanel, ArtifactType } from "@/components/organisms/CommandCenterArtifactPanel"
import { StateLayout } from "@/components/molecules/StateLayout"
import { AiCopilotIllustration } from "@/components/molecules/AiCopilotIllustration"
import api from "@/lib/api"
import { toast } from "sonner"
import { useWorkspaceStore } from "@/store/workspaceStore"
import { motion, AnimatePresence } from "framer-motion"
import { useDropzone } from "react-dropzone"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface CommandCenterChatProps {
  initialActionTitle?: string
  initialSessionId?: string
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1.5 p-2 px-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm rounded-none h-10 w-fit">
    <motion.div
      className="w-1.5 h-1.5 bg-slate-400 rounded-none"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
    />
    <motion.div
      className="w-1.5 h-1.5 bg-slate-400 rounded-none"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
    />
    <motion.div
      className="w-1.5 h-1.5 bg-slate-400 rounded-none"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
    />
  </div>
);

export function CommandCenterChat({ initialActionTitle, initialSessionId }: CommandCenterChatProps) {
  const { activeWs } = useWorkspaceStore()
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId)
  const [messages, setMessages] = useState<Message[]>(
    initialActionTitle 
      ? [{ role: "assistant", content: `I can help you with your **${initialActionTitle}**. Please upload your dataset files below or type any specific instructions to begin.` }]
      : []
  )

  useEffect(() => {
    if (initialSessionId) {
      // Fetch history
      api.get(`/owner/ai/chat/sessions/${initialSessionId}`).then(res => {
        setMessages(res.data)
      }).catch(err => console.error(err))
    }
  }, [initialSessionId])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Artifact state
  const [artifactOpen, setArtifactOpen] = useState(false)
  const [artifactType, setArtifactType] = useState<ArtifactType | null>(null)
  const [artifactTitle, setArtifactTitle] = useState("")
  const [artifactContent, setArtifactContent] = useState<React.ReactNode>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  })

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || !activeWs) return
    
    const userMessage = input.trim() || "Uploaded files for analysis"
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setIsTyping(true)

    try {
      const formData = new FormData()
      formData.append("workspace_id", activeWs.id)
      formData.append("message", userMessage)
      formData.append("history", JSON.stringify(messages.slice(-10)))
      if (sessionId) {
        formData.append("session_id", sessionId)
      }
      
      files.forEach(f => {
        formData.append("files", f)
      })

      const res = await api.post("/owner/ai/chat", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      if (res.data.session_id) {
        setSessionId(res.data.session_id)
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response || "I received your request." }])
      
      if (res.data.artifact) {
        setArtifactType(res.data.artifact.type)
        setArtifactTitle(res.data.artifact.title)
        setArtifactContent(<pre className="text-xs p-2 bg-slate-100 rounded">{res.data.artifact.content}</pre>)
        setArtifactOpen(true)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to communicate with the Command Center AI")
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error connecting to the backend. Is the Phase 3 backend implemented?" }])
    } finally {
      setIsTyping(false)
      setFiles([])
    }
  }

  return (
    <div className="flex flex-col h-full w-full relative bg-white/40 dark:bg-[#020617]/40 backdrop-blur-2xl overflow-hidden" {...getRootProps({ onClick: e => e.stopPropagation() })}>
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-emerald-500/10 backdrop-blur-sm border-2 border-emerald-500 border-dashed flex items-center justify-center">
          <div className="bg-white dark:bg-white/5 px-6 py-4 rounded-none shadow-xl flex items-center gap-3">
            <Paperclip className="w-6 h-6 text-emerald-500" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Drop files to upload</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full py-10">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <StateLayout
                  illustration={<AiCopilotIllustration />}
                  headline="Command Center Copilot"
                  description="I'm your AI assistant for managing platform operations. What would you like to know?"
                  aiSuggestion="Try asking: 'Generate a revenue report for this quarter'"
                  keyboardShortcut="Enter"
                />
              </motion.div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <CommandCenterMessage key={i} role={msg.role} content={msg.content} />
                ))}
              </AnimatePresence>
              
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start items-end gap-3 mt-4"
                  >
                    <div className="w-8 h-8 rounded-none bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 mb-1 shadow-sm ring-1 ring-emerald-500/20 mt-1">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <TypingIndicator />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <AnimatePresence>
        {artifactOpen && (
          <CommandCenterArtifactPanel
            isOpen={artifactOpen}
            onClose={() => setArtifactOpen(false)}
            type={artifactType}
            title={artifactTitle}
            content={artifactContent}
          />
        )}
      </AnimatePresence>

      <div className="w-full shrink-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 dark:to-transparent pt-6 pb-6 px-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-none shadow-sm p-3">
          {files.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3 px-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-none border border-slate-200 dark:border-slate-700 shadow-sm">
                  <FileType className="w-3 h-3 text-emerald-500" />
                  <span className="truncate max-w-[120px]">{f.name}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setFiles(prev => prev.filter((_, idx) => idx !== i))
                    }} 
                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none transition-colors ml-1"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => {
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                if (fileInput) fileInput.click()
              }}
              className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-none transition-colors shrink-0"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the Command Center (e.g. 'Generate a revenue report for Q3')"
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] text-[15px] text-slate-800 dark:text-slate-200 py-2.5 custom-scrollbar"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSend()
              }}
              disabled={isTyping || (!input.trim() && files.length === 0)}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
