"use client";

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User, Sparkles, Loader2, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/atoms/Logo"
import api from "@/lib/api"
import ReactMarkdown from 'react-markdown'

export function ExecutiveAIPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: "Hello Executive. I'm connected to the platform's core metrics, audit logs, and analytics. How can I assist you with platform operations today?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('toggle-executive-ai', handleOpen)
    return () => window.removeEventListener('toggle-executive-ai', handleOpen)
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)

    try {
      const formData = new FormData()
      formData.append("message", userMsg)
      formData.append("workspace_id", "owner-context") // Dummy ID for validation if required by backend structure
      
      if (sessionId) {
        formData.append("session_id", sessionId)
      }
      
      // Pass previous messages as history (excluding the first mock greeting if desired, but we can pass all)
      const historyToPass = messages.map(m => ({
        role: m.role,
        content: m.text
      }))
      formData.append("history", JSON.stringify(historyToPass))

      const response = await api.post("/owner/ai/chat", formData)
      
      if (response.data?.session_id && !sessionId) {
        setSessionId(response.data.session_id)
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: response.data.response }])
    } catch (error) {
      console.error("AI chat failed:", error)
      setMessages(prev => [...prev, { role: 'ai', text: "I encountered an error connecting to the platform services. Please check your network and API configurations." }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className={`fixed z-[9999] transition-all duration-300 ease-in-out ${isOpen ? (expanded ? 'bottom-6 right-6 w-[800px] max-w-[calc(100vw-18rem)] h-[800px] max-h-[85vh]' : 'bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh]') : 'bottom-6 right-6 w-auto h-14'}`}>
      
      {!isOpen && (
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] border-2 border-emerald-400 text-white cursor-pointer hover:bg-emerald-500 transition-colors"
        >
          <img src="/icon.svg" alt="Data Insight AI" className="h-7 w-auto brightness-0 invert" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-full h-full bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-card border-b border-slate-200 dark:border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 overflow-hidden">
                <img src="/logo.svg" alt="Data Insight" className="h-8 w-32 shrink-0 dark:brightness-0 dark:invert" />
                <div className="pl-4 border-l border-slate-200 dark:border-slate-700 flex flex-col justify-center shrink-0">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap">Executive AI</h3>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Data
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setExpanded(!expanded)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold text-xl leading-none">
                  &times;
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-background">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-white/5' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <Logo size={16} showText={false} href={null} />}
                  </div>
                  <div className={`w-fit max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm text-slate-700 dark:text-slate-300'}`}>
                    {msg.role === 'ai' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-hr:my-2 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Logo size={16} showText={false} href={null} />
                  </div>
                  <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Analyzing platform data...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-card border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about revenue, health, users, or audit logs..."
                  className="flex-1 bg-slate-100 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
                <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-auto px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
                {["Summarize today's activity", "Review audit logs", "Predict next month's MRR"].map(prompt => (
                  <button key={prompt} onClick={() => setInput(prompt)} className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-400 transition-colors">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
